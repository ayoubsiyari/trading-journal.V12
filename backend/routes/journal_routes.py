# routes/journal_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, JournalEntry
from sqlalchemy import func, desc
from datetime import datetime

journal_bp = Blueprint('journal', __name__)

@journal_bp.route('/add', methods=['POST'])
@jwt_required()
def add_entry():
    try:
        data = request.get_json()

        entry = JournalEntry(
            symbol=data['symbol'],
            direction=data['direction'],
            entry_price=float(data['entry_price']),
            exit_price=float(data['exit_price']),
            pnl=float(data.get('pnl') or 0),
            rr=float(data.get('rr') or 0),
            notes=data.get('notes', '')
        )
        db.session.add(entry)
        db.session.commit()
        return jsonify({'message': 'Journal entry added', 'id': entry.id}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@journal_bp.route('/list', methods=['GET'])
@jwt_required()
def list_entries():
    try:
        entries = JournalEntry.query.order_by(JournalEntry.created_at.desc()).all()
        return jsonify([
            {
                'id': e.id,
                'symbol': e.symbol,
                'direction': e.direction,
                'entry_price': e.entry_price,
                'exit_price': e.exit_price,
                'pnl': e.pnl,
                'rr': e.rr,
                'notes': e.notes,
                'created_at': e.created_at.isoformat(),
                'updated_at': e.updated_at.isoformat()
            }
            for e in entries
        ])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@journal_bp.route('/delete/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_entry(id):
    try:
        entry = JournalEntry.query.get_or_404(id)
        db.session.delete(entry)
        db.session.commit()
        return jsonify({'message': 'Journal entry deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@journal_bp.route('/edit/<int:id>', methods=['PUT'])
@jwt_required()
def edit_entry(id):
    try:
        data = request.get_json()
        entry = JournalEntry.query.get_or_404(id)
        entry.symbol = data.get('symbol', entry.symbol)
        entry.direction = data.get('direction', entry.direction)
        entry.entry_price = float(data.get('entry_price', entry.entry_price))
        entry.exit_price = float(data.get('exit_price', entry.exit_price))
        entry.pnl = float(data.get('pnl', entry.pnl))
        entry.rr = float(data.get('rr', entry.rr))
        entry.notes = data.get('notes', entry.notes)

        db.session.commit()
        return jsonify({'message': 'Journal entry updated'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

#
#  NEW: /stats route to return aggregated Dashboard metrics
#
@journal_bp.route('/stats', methods=['GET'])
@jwt_required()
def stats():
    try:
        # Fetch all entries
        entries = JournalEntry.query.order_by(JournalEntry.created_at.asc()).all()

        # If no trades have been recorded yet, return zeros
        if not entries:
            return jsonify({
                "total_trades": 0,
                "total_pnl": 0.0,
                "win_rate": 0.0,
                "profit_factor": 0.0,
                "avg_rr": 0.0,
                "max_drawdown": 0.0,
                "expectancy": 0.0,
                "kelly_percentage": 0.0,
                "sharpe_ratio": 0.0,
                "recovery_factor": 0.0,
                "avg_win": 0.0,
                "avg_loss": 0.0,
                "avg_pnl": 0.0,
                "max_consecutive_wins": 0,
                "max_consecutive_losses": 0,
                "buy_pnl": 0.0,
                "sell_pnl": 0.0,
                "win_loss": {"wins": 0, "losses": 0},
                "best_trade": {"symbol": None, "pnl": 0.0, "date": None, "rr": 0.0},
                "worst_trade": {"symbol": None, "pnl": 0.0, "date": None, "rr": 0.0},
                "equity_curve": [],
                "pnl_by_date": [],
                "top_symbols": [],
                "recent_trades": []
            }), 200

        # --- 1) Basic counts and sums ---
        total_trades = len(entries)
        total_pnl = sum(e.pnl for e in entries)

        wins = [e for e in entries if e.pnl > 0]
        losses = [e for e in entries if e.pnl < 0]
        win_count = len(wins)
        loss_count = len(losses)
        win_rate = (win_count / total_trades) * 100 if total_trades else 0

        # Profit factor = (sum of winning trades P&L) / (absolute sum of losing trades P&L)
        gross_profit = sum(e.pnl for e in wins)
        gross_loss = abs(sum(e.pnl for e in losses))
        profit_factor = (gross_profit / gross_loss) if gross_loss != 0 else float('inf') if gross_profit > 0 else 0

        # Average R:R (simply the average rr field)
        avg_rr = (sum(e.rr for e in entries) / total_trades) if total_trades else 0

        # --- 2) Max Drawdown & Equity Curve ---
        # Build a running equity curve
        equity = 0.0
        equity_curve = []
        for e in entries:
            equity += e.pnl
            equity_curve.append({"date": e.created_at.strftime("%Y-%m-%d"), "cumulative_pnl": round(equity, 2)})

        # Max drawdown: largest drop from peak to trough in that curve
        peak = equity_curve[0]["cumulative_pnl"]
        max_drawdown = 0.0
        for point in equity_curve:
            if point["cumulative_pnl"] > peak:
                peak = point["cumulative_pnl"]
            drawdown = peak - point["cumulative_pnl"]
            if drawdown > max_drawdown:
                max_drawdown = drawdown

        # PnL by date (group by created_at date)
        pnl_by_date_dict = {}
        for e in entries:
            date_key = e.created_at.strftime("%Y-%m-%d")
            pnl_by_date_dict.setdefault(date_key, 0.0)
            pnl_by_date_dict[date_key] += e.pnl
        pnl_by_date = [[date, pnl] for date, pnl in pnl_by_date_dict.items()]

        # --- 3) Expectancy, Kelly %, Sharpe, Recovery Factor (basic approximations) ---
        # Expectancy = (average win * win_rate%) - (average loss * loss_rate%)
        avg_win = (sum(e.pnl for e in wins) / win_count) if win_count else 0
        avg_loss = (abs(sum(e.pnl for e in losses)) / loss_count) if loss_count else 0
        expectancy = (avg_win * (win_rate / 100)) - (avg_loss * (loss_count / total_trades)) if total_trades else 0

        # Kelly % = W - ( (1 - W) / R ) where W=win_rate (decimal), R=avg_win/avg_loss
        w = win_rate / 100
        r = (avg_win / avg_loss) if avg_loss != 0 else float('inf')
        kelly_percentage = (w - ((1 - w) / r)) * 100 if (avg_loss and win_count) else 0

        # Sharpe ratio = (mean P&L) / stddev P&L ; assume risk‐free=0
        pl_values = [e.pnl for e in entries]
        mean_pnl = sum(pl_values) / total_trades
        variance = sum((x - mean_pnl) ** 2 for x in pl_values) / total_trades
        stddev = variance ** 0.5
        sharpe_ratio = (mean_pnl / stddev) if stddev != 0 else 0

        # Recovery Factor = (net profit) / max drawdown
        recovery_factor = (total_pnl / max_drawdown) if max_drawdown != 0 else float('inf') if total_pnl > 0 else 0

        # --- 4) Consecutive Wins/Losses ---
        consec_wins = consec_losses = max_consec_wins = max_consec_losses = 0
        for e in entries:
            if e.pnl > 0:
                consec_wins += 1
                consec_losses = 0
            else:
                consec_losses += 1
                consec_wins = 0
            max_consec_wins = max(max_consec_wins, consec_wins)
            max_consec_losses = max(max_consec_losses, consec_losses)

        # --- 5) Buy vs Sell PnL ---
        buy_pnl = sum(e.pnl for e in entries if e.direction == 'long')
        sell_pnl = sum(e.pnl for e in entries if e.direction == 'short')

        # --- 6) Best & Worst Trades ---
        best_trade_obj = max(entries, key=lambda x: x.pnl)
        worst_trade_obj = min(entries, key=lambda x: x.pnl)
        best_trade = {
            "symbol": best_trade_obj.symbol,
            "pnl": best_trade_obj.pnl,
            "date": best_trade_obj.created_at.strftime("%Y-%m-%d"),
            "rr": best_trade_obj.rr
        }
        worst_trade = {
            "symbol": worst_trade_obj.symbol,
            "pnl": worst_trade_obj.pnl,
            "date": worst_trade_obj.created_at.strftime("%Y-%m-%d"),
            "rr": worst_trade_obj.rr
        }

        # --- 7) Top Performing Symbols (by total PnL) ---
        symbol_totals = {}
        for e in entries:
            symbol_totals.setdefault(e.symbol, {"pnl": 0.0, "trades": 0, "wins": 0})
            symbol_totals[e.symbol]["pnl"] += e.pnl
            symbol_totals[e.symbol]["trades"] += 1
            if e.pnl > 0:
                symbol_totals[e.symbol]["wins"] += 1

        top_symbols = sorted(symbol_totals.items(), key=lambda kv: kv[1]["pnl"], reverse=True)
        top_symbols_clean = [[sym, sym_data] for sym, sym_data in top_symbols[:5]]

        # --- 8) Recent Trades (last 5) ---
        recent_trades_objs = sorted(entries, key=lambda x: x.created_at, reverse=True)[:5]
        recent_trades = [
            {
                "symbol": e.symbol,
                "direction": "Long" if e.direction == "long" else "Short",
                "date": e.created_at.strftime("%Y-%m-%d"),
                "pnl": e.pnl,
                "rr": e.rr,
                "setup": e.notes or ""
            }
            for e in recent_trades_objs
        ]

        return jsonify({
            "total_trades": total_trades,
            "total_pnl": round(total_pnl, 2),
            "win_rate": round(win_rate, 2),
            "profit_factor": round(profit_factor, 2) if profit_factor != float('inf') else float('inf'),
            "avg_rr": round(avg_rr, 2),
            "max_drawdown": round(max_drawdown, 2),
            "expectancy": round(expectancy, 2),
            "kelly_percentage": round(kelly_percentage, 2),
            "sharpe_ratio": round(sharpe_ratio, 2),
            "recovery_factor": round(recovery_factor, 2) if recovery_factor != float('inf') else float('inf'),
            "avg_win": round(avg_win, 2),
            "avg_loss": round(avg_loss, 2),
            "avg_pnl": round(mean_pnl, 2),
            "max_consecutive_wins": max_consec_wins,
            "max_consecutive_losses": max_consec_losses,
            "buy_pnl": round(buy_pnl, 2),
            "sell_pnl": round(sell_pnl, 2),
            "win_loss": {"wins": win_count, "losses": loss_count},
            "best_trade": best_trade,
            "worst_trade": worst_trade,
            "equity_curve": equity_curve,
            "pnl_by_date": pnl_by_date,
            "top_symbols": top_symbols_clean,
            "recent_trades": recent_trades
        }), 200

    except Exception as e:
        print("❌ ERROR in /stats:", str(e))
        return jsonify({"error": str(e)}), 500
