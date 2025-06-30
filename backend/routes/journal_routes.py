# routes/journal_routes.py

def analyze_variable_combinations(entries, combination_level=2):
    """
    Analyze combinations of variables to find the most profitable combinations.
    
    Args:
        entries: List of journal entries
        combination_level: Number of variables to combine (2 for pairs, 3 for trios, etc.)
    
    Returns:
        Dictionary with combination statistics
    """
    from itertools import combinations
    
    # First, collect all variables for each entry
    entry_vars = []
    variable_types = set()
    
    # Define system fields that should be excluded
    system_fields = {
        'trade_hour', 'trade_day', 'trade_week', 'trade_month', 'trade_year',
        'entry_time', 'exit_time', 'duration', 'trade_id', 'import_batch_id',
        'id', 'symbol', 'direction', 'entry_price', 'exit_price', 'quantity',
        'date', 'time', 'pnl', 'rr', 'notes', 'created_at', 'updated_at'
    }
    
    # Patterns that indicate system or non-variable fields
    system_patterns = ('_', 'unused', 'temp', 'meta', 'trade_', 'time_')
    
    for entry in entries:
        variables = {}
        
        # Primary: Check the variables field
        if entry.variables and isinstance(entry.variables, dict):
            for k, v in entry.variables.items():
                k_lower = k.lower()
                # Skip system fields, empty values, and fields matching system patterns
                if (k_lower not in system_fields and 
                    v is not None and 
                    str(v).strip() != '' and
                    not any(k_lower.startswith(p) for p in system_patterns)):
                    # Store the original key but track by lowercase
                    variables[k_lower] = v
        
        # Fallback: Check extra_data for variable-like fields
        if entry.extra_data and isinstance(entry.extra_data, dict):
            # Only consider fields that match variable patterns and aren't system fields
            for key, value in entry.extra_data.items():
                key_lower = key.lower()
                # Skip system fields, empty values, and fields matching system patterns
                if (key_lower not in system_fields and 
                    value is not None and 
                    str(value).strip() != '' and
                    not any(key_lower.startswith(p) for p in system_patterns) and
                    not any(p in key_lower for p in ('id', 'price', 'time', 'date', 'pnl', 'rr'))):
                    
                    # Convert value to list if it isn't already
                    if isinstance(value, list):
                        cleaned_values = [str(v).strip() for v in value if v and str(v).strip()]
                        if cleaned_values:
                            variables[key_lower] = cleaned_values
                    else:
                        value_str = str(value).strip()
                        if value_str:
                            variables[key_lower] = [value_str]
        
        # Convert to list of (key, value) pairs
        var_list = []
        for key, values in variables.items():
            if isinstance(values, list):
                for value in values:
                    if value and str(value).strip():
                        var_list.append((key, str(value).strip()))
                        variable_types.add(key)
            elif values and str(values).strip():
                var_list.append((key, str(values).strip()))
                variable_types.add(key)
        
        entry_vars.append({
            'entry': entry,
            'variables': var_list
        })
    
    # Generate all possible variable combinations
    variable_types = sorted(list(variable_types))
    combination_stats = {}
    
    # For each entry, generate all combinations of its variables
    for entry_data in entry_vars:
        # Skip entries with no variables
        if not entry_data['variables']:
            continue
            
        # Use min(combination_level, len(variables)) to avoid skipping trades with fewer variables
        actual_combination_level = min(combination_level, len(entry_data['variables']))
        
        # If no combinations possible, skip this entry
        if actual_combination_level < 1:
            continue
            
        # Generate all possible combinations for the actual combination level
        for var_combo in combinations(entry_data['variables'], actual_combination_level):
            # Sort to ensure consistent ordering (e.g., (A,B) is same as (B,A))
            var_combo = sorted(var_combo)
            combo_key = ' | '.join([f"{k}:{v}" for k, v in var_combo])
            
            if combo_key not in combination_stats:
                combination_stats[combo_key] = {
                    'trades': 0,
                    'wins': 0,
                    'losses': 0,
                    'total_rr': 0.0,
                    'total_pnl': 0.0,
                    'gross_profit': 0.0,
                    'gross_loss': 0.0,
                    'win_amounts': [],
                    'loss_amounts': [],
                    'max_drawdown': 0.0,
                    'running_pnl': 0.0,
                    'peak': 0.0,
                    'trades_data': [],
                    'variable_components': var_combo
                }
            
            stats = combination_stats[combo_key]
            entry = entry_data['entry']
            
            # Update statistics
            stats['trades'] += 1
            pnl = entry.pnl or 0.0
            rr = entry.rr or 0.0
            
            stats['total_rr'] += rr
            stats['total_pnl'] += pnl
            stats['running_pnl'] += pnl
            
            # Update peak and drawdown
            if stats['running_pnl'] > stats['peak']:
                stats['peak'] = stats['running_pnl']
            else:
                drawdown = stats['peak'] - stats['running_pnl']
                if drawdown > stats['max_drawdown']:
                    stats['max_drawdown'] = drawdown
            
            # Track wins/losses
            if pnl > 0:
                stats['wins'] += 1
                stats['gross_profit'] += pnl
                stats['win_amounts'].append(pnl)
            elif pnl < 0:
                stats['losses'] += 1
                stats['gross_loss'] += abs(pnl)
                stats['loss_amounts'].append(abs(pnl))
            
            # Store trade data
            stats['trades_data'].append({
                'date': entry.date.isoformat() if entry.date else None,
                'pnl': pnl,
                'rr': rr,
                'symbol': entry.symbol,
                'direction': entry.direction
            })
    
    # Calculate final metrics for each combination
    result = []
    for combo_key, stats in combination_stats.items():
        if stats['trades'] == 0:
            continue
            
        # Calculate win rate
        win_rate = (stats['wins'] / (stats['wins'] + stats['losses']) * 100) if (stats['wins'] + stats['losses']) > 0 else 0.0
        
        # Calculate average RR
        avg_rr = stats['total_rr'] / stats['trades'] if stats['trades'] > 0 else 0.0
        
        # Calculate profit factor
        profit_factor = 0.0
        if stats['gross_loss'] > 0:
            profit_factor = stats['gross_profit'] / stats['gross_loss']
        elif stats['gross_profit'] > 0:
            profit_factor = None  # Infinite profit factor
        
        # Calculate average win/loss
        avg_win = sum(stats['win_amounts']) / len(stats['win_amounts']) if stats['win_amounts'] else 0.0
        avg_loss = sum(stats['loss_amounts']) / len(stats['loss_amounts']) if stats['loss_amounts'] else 0.0
        
        # Calculate expectancy
        win_prob = stats['wins'] / stats['trades'] if stats['trades'] > 0 else 0
        loss_prob = stats['losses'] / stats['trades'] if stats['trades'] > 0 else 0
        expectancy = (win_prob * avg_win) - (loss_prob * avg_loss)
        
        # Prepare result entry
        result.append({
            'combination': combo_key,
            'trades': stats['trades'],
            'wins': stats['wins'],
            'losses': stats['losses'],
            'win_rate': round(win_rate, 1),
            'avg_rr': round(avg_rr, 2),
            'pnl': round(stats['total_pnl'], 2),
            'profit_factor': round(profit_factor, 2) if profit_factor is not None else None,
            'gross_profit': round(stats['gross_profit'], 2),
            'gross_loss': round(stats['gross_loss'], 2),
            'avg_win': round(avg_win, 2) if stats['win_amounts'] else 0.0,
            'avg_loss': round(avg_loss, 2) if stats['loss_amounts'] else 0.0,
            'max_drawdown': round(stats['max_drawdown'], 2) if stats['max_drawdown'] is not None else 0.0,
            'expectancy': round(expectancy, 2),
            'variable_components': [f"{k}:{v}" for k, v in stats['variable_components']]
        })
    
    # Sort by PnL descending
    result.sort(key=lambda x: x['pnl'], reverse=True)
    
    return result

import os
from flask import Blueprint, request, jsonify, send_file, Response
from flask_jwt_extended import jwt_required, get_jwt_identity
import yfinance as yf
from datetime import datetime, timedelta
import pandas as pd
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta, timezone
from models import db, JournalEntry, ImportBatch
import math
import io
import openai
import json

journal_bp = Blueprint('journal', __name__)

# Make sure uploads folder exists
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), '..', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Configure OpenAI API Key
# Make sure to set the OPENAI_API_KEY environment variable
openai.api_key = os.environ.get("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")


@journal_bp.route('/add', methods=['POST'])
@jwt_required()
def add_entry():
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()

        required_fields = ['symbol', 'direction', 'entry_price', 'exit_price', 'quantity']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        # Parse the trade date if provided, otherwise use current time in UTC
        trade_date = None
        if 'date' in data and data['date']:
            try:
                # Parse the date string and ensure it's timezone-aware
                if 'Z' in data['date']:
                    # Handle UTC timezone
                    trade_date = datetime.fromisoformat(data['date'].replace('Z', '+00:00'))
                elif '+' in data['date'] or data['date'].endswith('Z'):
                    # Already has timezone info
                    trade_date = datetime.fromisoformat(data['date'])
                else:
                    # No timezone info, assume local time and convert to UTC
                    local_date = datetime.fromisoformat(data['date'])
                    trade_date = local_date.astimezone(timezone.utc).replace(tzinfo=None)
            except (ValueError, TypeError) as e:
                print(f"Error parsing date {data['date']}: {e}")
                # Default to current time in UTC if parsing fails
                trade_date = datetime.utcnow()
        else:
            # Default to current time in UTC if no date provided
            trade_date = datetime.utcnow()
            
        # Ensure the trade date is timezone-aware
        if trade_date.tzinfo is None:
            trade_date = trade_date.replace(tzinfo=timezone.utc)
        else:
            # Convert to UTC if it has timezone info
            trade_date = trade_date.astimezone(timezone.utc)

        entry = JournalEntry(
            user_id=user_id,
            symbol=data['symbol'],
            direction=data['direction'],
            entry_price=float(data['entry_price']),
            exit_price=float(data['exit_price']),
            stop_loss=float(data['stop_loss']) if data.get('stop_loss') is not None else None,
            take_profit=float(data['take_profit']) if data.get('take_profit') is not None else None,
            quantity=float(data['quantity']),
            contract_size=(float(data['contract_size']) if data.get('contract_size') is not None else None),
            instrument_type=data.get('instrument_type'),
            risk_amount=(float(data['risk_amount']) if data.get('risk_amount') is not None else None),
            pnl=(float(data['pnl']) if data.get('pnl') is not None else None),
            rr=(float(data['rr']) if data.get('rr') is not None else None),
            notes=data.get('notes'),
            date=trade_date,  # Set the trade date
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            extra_data=data.get('extra_data', {}),
            variables=data.get('variables', {})
        )
        db.session.add(entry)
        db.session.commit()

        return jsonify({
            'trade': {
                'id': entry.id,
                'symbol': entry.symbol,
                'direction': entry.direction,
                'entry_price': entry.entry_price,
                'exit_price': entry.exit_price,
                'quantity': entry.quantity,
                'contract_size': entry.contract_size,
                'instrument_type': entry.instrument_type,
                'risk_amount': entry.risk_amount,
                'pnl': entry.pnl,
                'rr': entry.rr,
                'notes': entry.notes,
                'extra_data': entry.extra_data or {},
                'variables': entry.variables or {},  # 
                'created_at': entry.created_at.isoformat(),
                'updated_at': entry.updated_at.isoformat()  
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        print(" add_entry error:", e)
        return jsonify({'error': str(e)}), 500

@journal_bp.route('/list', methods=['GET'])
@jwt_required()
def list_entries():
    try:
        user_id = int(get_jwt_identity())

        entries = (
            JournalEntry.query
            .filter_by(user_id=user_id)
            .order_by(JournalEntry.created_at.desc())
            .all()
        )

        result = []
        for e in entries:
            result.append({
                'id': e.id,
                'symbol': e.symbol,
                'direction': e.direction,
                'entry_price': e.entry_price,
                'exit_price': e.exit_price,
                'quantity': e.quantity,
                'contract_size': e.contract_size,
                'instrument_type': e.instrument_type,
                'risk_amount': e.risk_amount,
                'pnl': e.pnl,
                'rr': e.rr,
                'notes': e.notes,
                'extra_data': e.extra_data or {},
                'variables': e.variables or {},  # 
                'date': e.date.isoformat(),
                'created_at': e.created_at.isoformat(),
                'updated_at': e.updated_at.isoformat()
            })

        return jsonify(result), 200

    except Exception as e:
        print(" list_entries error:", e)
        return jsonify({'error': str(e)}), 500

@journal_bp.route('/stats', methods=['GET'])
@jwt_required()
def stats():
    try:
        user_id_str = get_jwt_identity()
        user_id = int(user_id_str)

        entries = (
            JournalEntry.query
            .filter_by(user_id=user_id)
            .order_by(JournalEntry.created_at.asc())
            .all()
        )

        if not entries:
            return jsonify({
                "total_trades": 0,
                "total_pnl": 0.0,
                "win_rate": 0.0,
                "profit_factor": None,
                "avg_rr": 0.0,
                "max_drawdown": 0.0,
                "expectancy": 0.0,
                "kelly_percentage": 0.0,
                "sharpe_ratio": 0.0,
                "sortino_ratio": None,
                "recovery_factor": None,
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
                "gross_profit": 0.0,
                "gross_loss": 0.0,
                "top_symbols": [],
                "recent_trades": [],
                "best_day_of_week": {"day": None, "pnl": 0.0},
                "worst_day_of_week": {"day": None, "pnl": 0.0},
                "best_hour": {"hour": None, "pnl": 0.0},
                "worst_hour": {"hour": None, "pnl": 0.0},
                "max_drawdown_percent": 0.0,
                "trades": []
            }), 200
        total_trades = len(entries)
        total_pnl = sum(e.pnl for e in entries)

        # Calculate wins, losses, and break-even trades
        wins = [e for e in entries if e.pnl > 0]
        losses = [e for e in entries if e.pnl < 0]
        break_even = [e for e in entries if e.pnl == 0]
        
        win_count = len(wins)
        loss_count = len(losses)
        break_even_count = len(break_even)
        
        # Calculate win rate as (winning trades / (total trades - break even trades))
        total_trades_without_break_even = total_trades - break_even_count
        win_rate = (win_count / total_trades_without_break_even) * 100 if total_trades_without_break_even else 0.0

        gross_profit = sum(e.pnl for e in wins)
        gross_loss = abs(sum(e.pnl for e in losses))
        pf_raw = (gross_profit / gross_loss) if gross_loss != 0 else (
            float('inf') if gross_profit > 0 else 0.0
        )
        profit_factor = None if not math.isfinite(pf_raw) else round(pf_raw, 2)

        avg_rr_raw = sum(e.rr for e in entries) / total_trades if total_trades else 0.0
        avg_rr = round(avg_rr_raw, 2)

        # Build equity curve
        equity = 0.0
        equity_curve = []
        for e in entries:
            equity += e.pnl
            trade_dt = e.date or e.created_at
            equity_curve.append({
                "date": trade_dt.strftime("%Y-%m-%d"),
                "cumulative_pnl": round(equity, 2)
            })

        # Compute max drawdown (absolute)
        peak = equity_curve[0]["cumulative_pnl"]
        max_dd = 0.0
        for point in equity_curve:
            if point["cumulative_pnl"] > peak:
                peak = point["cumulative_pnl"]
            drawdown = peak - point["cumulative_pnl"]
            if drawdown > max_dd:
                max_dd = drawdown
        max_drawdown = round(max_dd, 2)

        # PnL by date
        pnl_by_date_dict = {}
        for e in entries:
            date_key = (e.date or e.created_at).strftime("%Y-%m-%d")
            pnl_by_date_dict.setdefault(date_key, 0.0)
            pnl_by_date_dict[date_key] += e.pnl
        pnl_by_date = [[date, pnl] for date, pnl in pnl_by_date_dict.items()]

        # Expectancy, Kelly, Sharpe, Sortino, Recovery
        avg_win_val = (sum(e.pnl for e in wins) / win_count) if win_count else 0.0
        avg_loss_val = (abs(sum(e.pnl for e in losses)) / loss_count) if loss_count else 0.0

        expectancy_raw = (
            (avg_win_val * (win_rate / 100)) -
            (avg_loss_val * (loss_count / total_trades))
        ) if total_trades else 0.0
        expectancy = round(expectancy_raw, 2)

        w = win_rate / 100.0
        r_ratio = (avg_win_val / avg_loss_val) if avg_loss_val != 0 else float('inf')
        kelly_raw = (w - ((1 - w) / r_ratio)) * 100 if (avg_loss_val and win_count) else 0.0
        kelly_percentage = None if not math.isfinite(kelly_raw) else round(kelly_raw, 2)

        pl_values = [e.pnl for e in entries]
        mean_pnl = sum(pl_values) / total_trades

        # Calculate Sharpe Ratio using daily returns with a fixed initial capital
        # This prevents division by small numbers that can inflate returns
        
        # Group trades by date
        trades_by_date = {}
        for entry in entries:
            trade_date = entry.date.strftime('%Y-%m-%d') if entry.date else entry.created_at.strftime('%Y-%m-%d')
            if trade_date not in trades_by_date:
                trades_by_date[trade_date] = []
            trades_by_date[trade_date].append(entry)
        
        # Sort dates chronologically
        sorted_dates = sorted(trades_by_date.keys())
        
        # Calculate daily returns
        daily_returns = []
        
        # Use a fixed initial capital of 10,000 (or another reasonable starting amount)
        # This is a common approach to normalize returns
        initial_capital = 10000.0
        current_equity = initial_capital
        
        # Calculate daily returns as percentage change in equity
        for date in sorted_dates:
            # Calculate daily P&L
            daily_pnl = sum(entry.pnl for entry in trades_by_date[date] if entry.pnl is not None)
            
            # Calculate daily return as percentage of current equity
            # Add a small constant to avoid division by zero
            daily_return = daily_pnl / (current_equity + 1e-8)
            daily_returns.append(daily_return)
            
            # Update current equity for next day's calculation
            current_equity += daily_pnl
        
        # Calculate Sharpe Ratio (annualized with 252 trading days)
        if len(daily_returns) >= 2:  # Need at least 2 points for stddev
            mean_return = sum(daily_returns) / len(daily_returns)
            stddev = (sum((x - mean_return) ** 2 for x in daily_returns) / len(daily_returns)) ** 0.5
            sharpe_ratio = round((mean_return / stddev * (252 ** 0.5)) if stddev != 0 else 0.0, 2)
        else:
            sharpe_ratio = 0.0

        # Sortino Ratio: downside deviation uses only negative returns
        downside_sq_sum = sum((r_val ** 2) for r_val in pl_values if r_val < 0)
        downside_variance = downside_sq_sum / total_trades
        downside_std = math.sqrt(downside_variance)
        if downside_std == 0:
            sortino_ratio = None
        else:
            sortino_raw = mean_pnl / downside_std
            sortino_ratio = round(sortino_raw, 2)

        rec_raw = (total_pnl / max_dd) if max_dd != 0 else (
            float('inf') if total_pnl > 0 else 0.0
        )
        recovery_factor = None if not math.isfinite(rec_raw) else round(rec_raw, 2)

        # Consecutive wins/losses
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

        buy_pnl = sum(e.pnl for e in entries if e.direction.lower() == 'long')
        sell_pnl = sum(e.pnl for e in entries if e.direction.lower() == 'short')

        # Best / Worst trades
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

        # Top-performing symbols
        symbol_totals = {}
        for e in entries:
            symbol_totals.setdefault(e.symbol, {"pnl": 0.0, "trades": 0, "wins": 0})
            symbol_totals[e.symbol]["pnl"] += e.pnl
            symbol_totals[e.symbol]["trades"] += 1
            if e.pnl > 0:
                symbol_totals[e.symbol]["wins"] += 1

        top_symbols = sorted(
            symbol_totals.items(),
            key=lambda kv: kv[1]["pnl"],
            reverse=True
        )
        top_symbols_clean = [[sym, data] for sym, data in top_symbols[:6]]

        # Recent trades
        recent_trades_objs = sorted(entries, key=lambda x: (x.date or x.created_at), reverse=True)[:5]
        recent_trades = []
        for e in recent_trades_objs:
            recent_trades.append({
                "symbol": e.symbol,
                "direction": "Long" if e.direction.lower() == "long" else "Short",
                "date": (e.date or e.created_at).strftime("%Y-%m-%d"),
                "pnl": e.pnl,
                "rr": e.rr,
                "setup": e.notes or ""
            })

        # ===== ADDITIONAL TIME-BASED METRICS =====

        # 1) Day-of-week P&L totals (0=Monday, ..., 6=Sunday)
        day_of_week_map = {i: 0.0 for i in range(7)}
        # 2) Hourly P&L totals (0..23)
        hour_map = {h: 0.0 for h in range(24)}

        for e in entries:
            dt = e.created_at
            dow = dt.weekday()  # Monday=0
            day_of_week_map[dow] += e.pnl
            hour_map[dt.hour] += e.pnl

        # Best/Worst day of week
        best_dow_index = max(day_of_week_map, key=lambda k: day_of_week_map[k])
        worst_dow_index = min(day_of_week_map, key=lambda k: day_of_week_map[k])
        dow_labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        best_day_of_week = {
            "day": dow_labels[best_dow_index],
            "pnl": round(day_of_week_map[best_dow_index], 2)
        }
        worst_day_of_week = {
            "day": dow_labels[worst_dow_index],
            "pnl": round(day_of_week_map[worst_dow_index], 2)
        }

        # Best/Worst hour
        best_hour = max(hour_map, key=lambda h: hour_map[h])
        worst_hour = min(hour_map, key=lambda h: hour_map[h])
        best_hour_obj = {
            "hour": best_hour,
            "pnl": round(hour_map[best_hour], 2)
        }
        worst_hour_obj = {
            "hour": worst_hour,
            "pnl": round(hour_map[worst_hour], 2)
        }

        # Max drawdown percent
        peak_equity = max([pt["cumulative_pnl"] for pt in equity_curve] + [1.0])
        max_drawdown_percent = round((max_dd / peak_equity) * 100, 2) if peak_equity else 0.0

        return jsonify({
            "total_trades": total_trades,
            "total_pnl": round(total_pnl, 2),
            "win_rate": round(win_rate, 2),
            "profit_factor": profit_factor,
            "avg_rr": avg_rr,
            "max_drawdown": max_drawdown,
            "expectancy": expectancy,
            "kelly_percentage": kelly_percentage,
            "sharpe_ratio": sharpe_ratio,
            "sortino_ratio": sortino_ratio,
            "recovery_factor": recovery_factor,
            "avg_win": round(avg_win_val, 2),
            "avg_loss": round(avg_loss_val, 2),
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
            "gross_profit": round(gross_profit, 2),
            "gross_loss": round(gross_loss, 2),
            "top_symbols": top_symbols_clean,
            "recent_trades": recent_trades,
            "best_day_of_week": best_day_of_week,
            "worst_day_of_week": worst_day_of_week,
            "best_hour": best_hour_obj,
            "worst_hour": worst_hour_obj,
            "max_drawdown_percent": max_drawdown_percent,
            "trades": [
                {
                    "id": e.id,
                    "symbol": e.symbol,
                    "direction": e.direction,
                    "pnl": e.pnl,
                    "rr": e.rr,
                    "entry_price": e.entry_price,
                    "exit_price": e.exit_price,
                    "quantity": e.quantity,
                    "instrument_type": e.instrument_type,
                    "contract_size": e.contract_size,
                    "risk_amount": e.risk_amount,
                    "strategy": e.strategy,
                    "setup": e.setup,
                    "notes": e.notes,
                    "date": (e.date or e.entry_date or e.created_at).strftime("%Y-%m-%d")
                }
                for e in entries
            ]
        }), 200

    except Exception as e:
        print(" stats error:", e)
        return jsonify({"error": str(e)}), 500


@journal_bp.route('/delete/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_entry(id):
    try:
        user_id_str = get_jwt_identity()
        user_id = int(user_id_str)

        entry = JournalEntry.query.filter_by(id=id, user_id=user_id).first()
        if entry is None:
            return jsonify({'error': 'Trade not found or not yours'}), 404

        db.session.delete(entry)
        db.session.commit()
        return jsonify({'message': 'Journal entry deleted'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@journal_bp.route('/export', methods=['GET'])
@jwt_required()
def export_entries():
    """
    Export all journal entries as an .xlsx file.
    Columns: symbol, direction, entry_price, exit_price,
             quantity, contract_size, instrument_type, risk_amount,
             pnl, rr, notes, created_at
    """
    try:
        entries = JournalEntry.query.order_by(JournalEntry.created_at.asc()).all()

        rows = []
        for e in entries:
            rows.append({
                'symbol': e.symbol,
                'direction': e.direction,
                'entry_price': e.entry_price,
                'exit_price': e.exit_price,
                'quantity': e.quantity,
                'contract_size': e.contract_size,
                'instrument_type': e.instrument_type,
                'risk_amount': e.risk_amount,
                'pnl': e.pnl,
                'rr': e.rr,
                'notes': e.notes,
                'created_at': e.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            })

        df = pd.DataFrame(rows)
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Journal')
        output.seek(0)

        return send_file(
            output,
            download_name='trading_journal.xlsx',
            as_attachment=True,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )

    except Exception as e:
        print(" export_entries error:", e)
        return jsonify({'error': str(e)}), 500


# ─── Excel-upload importer at /import/excel ───────────────────────────────────
@journal_bp.route('/import/excel', methods=['POST'])
@jwt_required()
def import_entries_excel():
    """
    Upload an Excel file under multipart/form-data field "file".
    Saves the file to disk, creates an ImportBatch with filepath,
    then reads trades out of it and inserts JournalEntry rows.
    """
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in request'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    try:
        user_id = int(get_jwt_identity())

        # 1) Create a new ImportBatch record (with placeholder filepath for now)
        filename = file.filename
        batch = ImportBatch(
            user_id=user_id,
            filename=filename,
            imported_at=datetime.utcnow(),
            filepath=''  # Will update in a momentaa
        )
        db.session.add(batch)
        db.session.flush()  # so batch.id is populated

        # 2) Save the uploaded file to disk under uploads/
        #    We use batch.id to make filename unique
        saved_filename = f"import_{batch.id}_{filename}"
        save_path = os.path.join(UPLOAD_FOLDER, saved_filename)
        file.save(save_path)

        # 3) Update the batch with its filepath
        batch.filepath = save_path
        db.session.commit()   # commit so that filepath is stored

        # 4) Read that same Excel file via pandas
        df = pd.read_excel(save_path)
        imported_count = 0

        for _, row in df.iterrows():
            symbol      = row.get('symbol')
            direction   = row.get('direction')
            entry_price = row.get('entry_price')
            exit_price  = row.get('exit_price')
            pnl         = row.get('pnl')

            # Skip if required fields are NaN
            if pd.isna(symbol) or pd.isna(direction) or pd.isna(entry_price) or pd.isna(exit_price) or pd.isna(pnl):
                continue

            # Determine trade date (use provided date or now)
            trade_date = None
            if 'date' in row and not pd.isna(row['date']):
                trade_date = pd.to_datetime(row['date'], errors='coerce')
            elif 'created_at' in row and not pd.isna(row['created_at']):
                trade_date = pd.to_datetime(row['created_at'], errors='coerce')
            
            if not pd.isna(trade_date):
                trade_date = trade_date.to_pydatetime()
            else:
                trade_date = datetime.utcnow()

            entry = JournalEntry(
                user_id=user_id,
                symbol=str(symbol).upper(),
                direction=str(direction).lower(),
                entry_price=float(entry_price),
                exit_price=float(exit_price),
                quantity=float(row['quantity']) if 'quantity' in row and not pd.isna(row['quantity']) else 1.0,
                contract_size=float(row['contract_size']) if 'contract_size' in row and not pd.isna(row['contract_size']) else None,
                instrument_type=row.get('instrument_type') if 'instrument_type' in row and not pd.isna(row['instrument_type']) else 'crypto',
                risk_amount=float(row['risk_amount']) if 'risk_amount' in row and not pd.isna(row['risk_amount']) else 1.0,
                pnl=float(pnl),
                rr=float(row['rr']) if 'rr' in row and not pd.isna(row['rr']) else 0.0,
                notes=row['notes'] if 'notes' in row and not pd.isna(row['notes']) else None,
                date=trade_date,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
                import_batch_id=batch.id
            )
            db.session.add(entry)
            imported_count += 1

        db.session.commit()
        return jsonify({'message': 'Excel import successful', 'imported': imported_count}), 200

    except Exception as e:
        db.session.rollback()
        print(" import_entries_excel error:", e)
        return jsonify({'error': str(e)}), 500


@journal_bp.route('/import', methods=['POST'])
@jwt_required()
def import_trades_json():
    """
    Accepts a list of trades (JSON‐array).  Each trade must have at least
    'symbol', 'direction' and 'pnl'.  Instead of immediately inserting them,
    we first create an ImportBatch row so that it shows up in /import/history.
    """
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        trades = data.get('trades', [])
        if not isinstance(trades, list):
            return jsonify({'error': 'Expected a list of trades'}), 400

        # 1) Create a new ImportBatch record (no file‐upload here, so filepath is blank)
        batch = ImportBatch(
            user_id=user_id,
            filename=data.get('filename', f'manual_import_{datetime.utcnow().strftime("%Y%m%d_%H%M%S")}'),
            imported_at=datetime.utcnow(),
            filepath=''   # no actual file on disk for JSON imports
        )
        db.session.add(batch)
        db.session.flush()   # so batch.id gets populated

        inserted_count = 0
        # 2) Insert each JournalEntry with import_batch_id=batch.id
        for t in trades:
            # only insert if required fields exist
            if not all(k in t for k in ('symbol', 'direction', 'pnl')):
                continue

            symbol    = t['symbol'].upper()
            direction = t['direction'].lower()
            pnl       = float(t['pnl'])
            rr        = float(t.get('rr', 0.0))
            notes     = t.get('notes', '')

            # Parse trade date and time if provided
            trade_date = None
            trade_time = None
            created_at = None
            
            # First, check if we have a timestamp field (ISO format with time)
            if 'timestamp' in t and t['timestamp']:
                try:
                    created_at = datetime.fromisoformat(str(t['timestamp']).replace('Z', '+00:00'))
                    trade_date = created_at.date()
                except (ValueError, TypeError):
                    pass
            
            # If no timestamp, try to parse date and time separately
            if not created_at:
                # Parse date
                if 'date' in t and t['date']:
                    date_str = str(t['date']).strip()
                    if date_str:  # Only try parsing if we have a non-empty string
                        try:
                            # First try ISO format
                            trade_date = datetime.fromisoformat(date_str).date()
                        except (ValueError, TypeError):
                            try:
                                # Try parsing as YYYY-MM-DD
                                trade_date = datetime.strptime(date_str, '%Y-%m-%d').date()
                            except (ValueError, TypeError):
                                try:
                                    # Try parsing as MM/DD/YYYY
                                    trade_date = datetime.strptime(date_str, '%m/%d/%Y').date()
                                except (ValueError, TypeError):
                                    try:
                                        # Try parsing as DD/MM/YYYY
                                        trade_date = datetime.strptime(date_str, '%d/%m/%Y').date()
                                    except (ValueError, TypeError):
                                        pass  # Keep None if all parsing fails
                
                # Parse time if available
                if 'time' in t and t['time']:
                    time_str = str(t['time']).strip()
                    if time_str:
                        try:
                            # Try parsing as HH:MM:SS or HH:MM
                            if ':' in time_str:
                                time_parts = time_str.split(':')
                                hours = int(time_parts[0])
                                minutes = int(time_parts[1]) if len(time_parts) > 1 else 0
                                seconds = int(time_parts[2]) if len(time_parts) > 2 else 0
                                trade_time = (hours, minutes, seconds)
                        except (ValueError, IndexError):
                            pass
            
            # If we have both date and time, combine them
            if trade_date and trade_time:
                try:
                    created_at = datetime.combine(
                        trade_date, 
                        datetime.min.time().replace(
                            hour=trade_time[0], 
                            minute=trade_time[1], 
                            second=trade_time[2] if len(trade_time) > 2 else 0
                        )
                    )
                except (ValueError, TypeError):
                    pass
            
            # If we still don't have a created_at, use the current time
            if not created_at:
                if trade_date:
                    created_at = datetime.combine(trade_date, datetime.utcnow().time())
                else:
                    created_at = datetime.utcnow()
                    trade_date = created_at.date()

            # Extract variables from the trade data and normalize to lowercase
            variables = {}
            # Check for common variable fields
            variable_fields = ['setup', 'mistake', 'emotion', 'strategy', 'market_condition']
            for field in variable_fields:
                if field in t and t[field]:
                    # If it's a list, process each item
                    if isinstance(t[field], list):
                        # Filter out empty strings, strip whitespace, and convert to lowercase
                        variables[field] = [
                            str(item).lower().strip() 
                            for item in t[field] 
                            if item and str(item).strip()
                        ]
                    else:
                        value = str(t[field]).strip().lower()
                        if value:  # Only add non-empty values
                            variables[field] = [value]
            
            # Also check for any fields that start with 'var_' as potential variables
            for key, value in t.items():
                if key.startswith('var_') and value:
                    var_name = key[4:].lower()  # Remove 'var_' prefix and convert to lowercase
                    if isinstance(value, list):
                        # Process each item in the list
                        variables[var_name] = [
                            str(item).lower().strip() 
                            for item in value 
                            if item is not None and str(item).strip()
                        ]
                    else:
                        value = str(value).strip().lower()
                        if value:  # Only add non-empty values
                            variables[var_name] = [value]
                            
            # Process any additional variables in extra_data
            if 'extra_data' in t and isinstance(t['extra_data'], dict):
                for key, value in t['extra_data'].items():
                    if key not in variables:  # Don't overwrite existing variables
                        if isinstance(value, list):
                            variables[key.lower()] = [
                                str(item).lower().strip() 
                                for item in value 
                                if item is not None and str(item).strip()
                            ]
                        elif value is not None and str(value).strip():
                            variables[key.lower()] = [str(value).lower().strip()]
            
            # If no variables were found, set to None to avoid storing empty dict
            variables = variables if variables else None
            
            # Get entry and exit prices with proper defaults
            entry_price = float(t.get('entry_price', 0.0)) if t.get('entry_price') is not None else 0.0
            exit_price = float(t.get('exit_price', 0.0)) if t.get('exit_price') is not None else 0.0
            stop_loss = float(t['stop_loss']) if t.get('stop_loss') is not None else None
            take_profit = float(t['take_profit']) if t.get('take_profit') is not None else None
            
            entry = JournalEntry(
                user_id=user_id,
                symbol=str(symbol).upper(),
                direction=str(direction).lower(),
                entry_price=entry_price,
                exit_price=exit_price,
                stop_loss=stop_loss,
                take_profit=take_profit,
                quantity=float(t.get('quantity', 1.0)),
                contract_size=float(t['contract_size']) if t.get('contract_size') is not None else None,
                instrument_type=t.get('instrument_type', 'crypto'),
                risk_amount=float(t.get('risk_amount', 0.0)) if t.get('risk_amount') is not None else 0.0,
                pnl=pnl,
                rr=rr,
                notes=notes,
                variables=variables,  # Save the extracted variables
                extra_data=t.get('extra_data', {}),
                date=trade_date,
                created_at=created_at,  # Use the parsed timestamp
                updated_at=datetime.utcnow(),
                import_batch_id=batch.id
            )
            db.session.add(entry)
            inserted_count += 1

        # 3) Update the batch’s trade_count before commit
        batch.trade_count = inserted_count

        db.session.commit()
        return jsonify({
            'message': f'Imported {inserted_count} trades',
            'inserted_count': inserted_count,
            'batch_id': batch.id
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@journal_bp.route('/market/benchmark', methods=['GET'])
@jwt_required(optional=True)
def market_benchmark():
    """Return daily closing prices for a benchmark symbol between start and end (YYYY-MM-DD)."""
    symbol = request.args.get('symbol', 'SPY').upper()
    start = request.args.get('start')
    end = request.args.get('end')
    if not start or not end:
        return jsonify({'error': 'start and end query parameters required (YYYY-MM-DD)'}), 400
    try:
        start_dt = datetime.strptime(start, '%Y-%m-%d')
        end_dt = datetime.strptime(end, '%Y-%m-%d')
    except ValueError:
        return jsonify({'error': 'Invalid date format, expected YYYY-MM-DD'}), 400
    try:
        data = yf.download(symbol, start=start_dt, end=end_dt, progress=False)
        close_series = data['Adj Close'] if 'Adj Close' in data else data['Close']
        result = [{'date': idx.strftime('%Y-%m-%d'), 'price': round(val, 2)} for idx, val in close_series.items() if not pd.isna(val)]
        return jsonify({'symbol': symbol, 'prices': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@journal_bp.route('/import/history', methods=['GET'])
@jwt_required()
def import_history():
    """
    Return list of past import batches for the current user,
    including id, filename, imported_at, trade_count, and download_url.
    """
    try:
        user_id_str = get_jwt_identity()
        user_id = int(user_id_str)

        batches = (
            ImportBatch.query
            .filter_by(user_id=user_id)
            .order_by(ImportBatch.imported_at.desc())
            .all()
        )

        result = []
        for b in batches:
            trade_count = JournalEntry.query.filter_by(import_batch_id=b.id).count()
            # Construct a download URL (front end can hit this)
            download_url = f"/api/journal/import/file/{b.id}"

            result.append({
                'id': b.id,
                'filename': b.filename,
                'imported_at': b.imported_at.isoformat(),
                'trade_count': trade_count,
                'download_url': download_url
            })

        return jsonify(result), 200

    except Exception as e:
        print(" import_history error:", e)
        return jsonify({'error': str(e)}), 500

@journal_bp.route('/import/file/<int:batch_id>', methods=['GET'])
@jwt_required()
def download_imported_file(batch_id):
    """
    Send back the originally‐uploaded Excel file for a given import batch.
    """
    try:
        user_id_str = get_jwt_identity()
        user_id = int(user_id_str)

        batch = ImportBatch.query.filter_by(id=batch_id, user_id=user_id).first_or_404()
        if not batch.filepath or not os.path.isfile(batch.filepath):
            return jsonify({'error': 'File not found on server'}), 404

        # Use send_file with as_attachment=True so the browser downloads it
        return send_file(
            batch.filepath,
            as_attachment=True,
            download_name=batch.filename,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )

    except Exception as e:
        print(" download_imported_file error:", e)
        return jsonify({'error': str(e)}), 500


@journal_bp.route('/import/<int:batch_id>', methods=['DELETE'])
@jwt_required()
def delete_import_batch(batch_id):
    """
    Delete a specific import batch (and its file + trades).
    """
    try:
        user_id_str = get_jwt_identity()
        user_id = int(user_id_str)

        batch = ImportBatch.query.filter_by(id=batch_id, user_id=user_id).first_or_404()

        # 1) Delete the file from disk (if it still exists)
        if batch.filepath and os.path.isfile(batch.filepath):
            os.remove(batch.filepath)

        # 2) Deleting the batch cascades to JournalEntry via relationship
        db.session.delete(batch)
        db.session.commit()
        return jsonify({'message': 'Import batch, its file, and trades deleted'}), 200

    except Exception as e:
        db.session.rollback()
        print(" delete_import_batch error:", e)
        return jsonify({'error': str(e)}), 500


@journal_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_entry(id):
    try:
        data = request.get_json()
        entry = JournalEntry.query.get_or_404(id)

        entry.symbol = data.get('symbol', entry.symbol)
        entry.direction = data.get('direction', entry.direction)
        entry.entry_price = data.get('entry_price', entry.entry_price)
        entry.exit_price = data.get('exit_price', entry.exit_price)
        if 'stop_loss' in data:
            entry.stop_loss = float(data['stop_loss']) if data['stop_loss'] is not None else None
        if 'take_profit' in data:
            entry.take_profit = float(data['take_profit']) if data['take_profit'] is not None else None
        entry.pnl = data.get('pnl', entry.pnl)
        entry.rr = data.get('rr', entry.rr)
        entry.notes = data.get('notes', entry.notes)

        if 'extra_data' in data:
            entry.extra_data = data['extra_data']
        if 'variables' in data:  
            entry.variables = data['variables']

        db.session.commit()
        return jsonify({'message': 'Journal entry updated'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@journal_bp.route('/strategy-analysis', methods=['GET'])
@jwt_required()
def strategy_analysis():
    try:
        user_id = int(get_jwt_identity())
        entries = JournalEntry.query.filter_by(user_id=user_id).all()

        strategy_map = {}

        for entry in entries:
            strategy = entry.strategy or 'Unspecified'
            stats = strategy_map.setdefault(strategy, {
                'trades': 0,
                'wins': 0,
                'total_rr': 0.0,
                'total_pnl': 0.0
            })

            if entry.pnl == 0:
                continue  # Skip break-even trades
                
            stats['trades'] += 1
            stats['total_rr'] += entry.rr or 0.0
            stats['total_pnl'] += entry.pnl or 0.0
            if entry.pnl > 0:
                stats['wins'] += 1

        result = []
        for strategy, data in strategy_map.items():
            total = data['trades']
            win_rate = (data['wins'] / total * 100) if total else 0.0
            avg_rr = (data['total_rr'] / total) if total else 0.0
            result.append({
                'strategy': strategy,
                'trades': total,
                'win_rate': round(win_rate, 1),
                'avg_rr': round(avg_rr, 2),
                'pnl': round(data['total_pnl'], 2)
            })

        return jsonify(result), 200

    except Exception as e:
        print(" strategy_analysis error:", e)
        return jsonify({'error': str(e)}), 500

@journal_bp.route('/variables-analysis', methods=['GET'])
@jwt_required()
def variables_analysis():
    """
    Return performance metrics grouped by variable tags for the current user.
    
    Query Parameters:
        from_date: Filter trades on or after this date (YYYY-MM-DD)
        to_date: Filter trades on or before this date (YYYY-MM-DD)
        timeframe: Filter by time period ('30', '90', '365', 'all')
        combine_vars: If 'true', also include variable combinations (default: false)
        combination_level: Number of variables to combine (2-5, default: 2)
    
    Returns:
        JSON response with variable statistics and combinations
    """
    try:
        user_id = int(get_jwt_identity())
        
        # Get query parameters for filtering
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        timeframe = request.args.get('timeframe', 'all')
        combine_vars = request.args.get('combine_vars', 'false').lower() == 'true'
        combination_level = min(max(int(request.args.get('combination_level', 2)), 2), 5)
        
        # Base query
        query = JournalEntry.query.filter_by(user_id=user_id).order_by(JournalEntry.date.asc())
        
        # Apply timeframe filter if provided
        if timeframe and timeframe != 'all':
            try:
                days = int(timeframe)
                cutoff_date = datetime.utcnow() - timedelta(days=days)
                query = query.filter(JournalEntry.date >= cutoff_date)
            except ValueError:
                # If timeframe is not a number, ignore it
                pass
        
        # Apply date filters if provided
        if from_date:
            try:
                from_date = datetime.strptime(from_date, '%Y-%m-%d')
                query = query.filter(JournalEntry.date >= from_date)
            except ValueError:
                return jsonify({'error': 'Invalid from_date format. Use YYYY-MM-DD'}), 400
                
        if to_date:
            try:
                to_date = datetime.strptime(to_date, '%Y-%m-%d')
                query = query.filter(JournalEntry.date <= to_date)
            except ValueError:
                return jsonify({'error': 'Invalid to_date format. Use YYYY-MM-DD'}), 400
        
        # Get all entries that match the filters
        entries = query.all()
        
        # If no entries found, return empty result
        if not entries:
            return jsonify({
                'variables': [],
                'combinations': [],
                'stats_summary': {
                    'total_trades': 0,
                    'total_pnl': 0.0,
                    'avg_win_rate': 0.0
                }
            })
            
        variable_stats = {}
        all_variable_names = set()
        processed_entries = 0
        skipped_entries = 0
        
        # Define system fields that should be excluded from variables analysis
        system_fields = {
            'trade_hour', 'trade_day', 'trade_week', 'trade_month', 'trade_year',
            'entry_time', 'exit_time', 'duration', 'trade_id', 'import_batch_id'
        }
        
        # First pass: collect all unique variable names across all entries
        for entry in entries:
            # Skip entries without variables
            if not entry.variables and not entry.extra_data:
                continue
                
            variables = {}
            
            # Primary: Check the variables field
            if entry.variables and isinstance(entry.variables, dict):
                # Only include non-system fields and normalize case
                for k, v in entry.variables.items():
                    k_lower = k.lower()
                    # Skip empty values and system fields
                    if k_lower not in system_fields and v is not None and str(v).strip() != '':
                        # Store the original key but track by lowercase
                        variables[k_lower] = v
                all_variable_names.update(variables.keys())
            
            # Fallback: Check extra_data for variable-like fields
            if entry.extra_data and isinstance(entry.extra_data, dict):
                # Add all keys from extra_data that aren't core or system fields
                core_fields = {'id', 'symbol', 'direction', 'entry_price', 'exit_price', 'quantity', 
                             'date', 'time', 'pnl', 'rr', 'notes', 'created_at', 'updated_at',
                             'trade_id', 'import_batch_id', 'trade_hour', 'trade_day', 'trade_week',
                             'trade_month', 'trade_year', 'entry_time', 'exit_time', 'duration'}
                
                for key, value in entry.extra_data.items():
                    key_lower = key.lower()
                    # Skip core fields, system fields, and common non-variable fields
                    if (key_lower not in core_fields and 
                        key_lower not in system_fields and
                        not key_lower.startswith(('_', 'unused', 'temp', 'meta', 'trade_', 'time_')) and
                        value is not None and str(value).strip() != ''):
                        # Use lowercase for consistent naming
                        all_variable_names.add(key_lower)
        
        # Second pass: process entries with the collected variable names
        for entry in entries:
            # Skip entries without variables
            if not entry.variables and not entry.extra_data:
                skipped_entries += 1
                continue
                
            variables = {}
            
            # Primary: Check the variables field
            if entry.variables and isinstance(entry.variables, dict):
                # Only include non-system fields and normalize case
                for k, v in entry.variables.items():
                    k_lower = k.lower()
                    # Skip empty values and system fields
                    if (k_lower not in system_fields and 
                        v is not None and 
                        str(v).strip() != '' and
                        not k_lower.startswith(('_', 'unused', 'temp', 'meta', 'trade_', 'time_'))):
                        variables[k_lower] = v
            
            # Fallback: Check extra_data for variable-like fields
            if entry.extra_data and isinstance(entry.extra_data, dict):
                for var_name in all_variable_names:
                    if (var_name in entry.extra_data and 
                        entry.extra_data[var_name] and 
                        var_name not in system_fields and
                        not var_name.startswith(('_', 'unused', 'temp', 'meta', 'trade_', 'time_'))):
                        # Only add if not already present from variables field
                        if var_name not in variables:
                            value = entry.extra_data[var_name]
                            # Ensure value is in list format
                            if isinstance(value, list):
                                variables[var_name] = [str(v).strip() for v in value if v and str(v).strip()]
                            else:
                                value_str = str(value).strip()
                                if value_str:
                                    variables[var_name] = [value_str]
            
            # Skip entries with no variables found
            if not variables:
                skipped_entries += 1
                continue
                
            # Ensure all variables from our set are present in this entry (even if empty)
            # Convert variable names to lowercase for consistency
            variables_lower = {k.lower(): v for k, v in variables.items()}
            
            processed_entries += 1
            
            # Process each variable in this entry
            for var_name in all_variable_names:
                # Get the value for this variable (case-insensitive)
                value = variables_lower.get(var_name, [])
                
                # Handle both list and string formats
                if isinstance(value, list):
                    tags = [str(v).strip() for v in value if v and str(v).strip()]
                else:
                    value_str = str(value).strip()
                    tags = [value_str] if value_str else []

                for tag in tags:
                    if not tag:
                        continue
                        
                    # Use lowercase variable name for consistency
                    group = f"{var_name}: {tag}"
                    if group not in variable_stats:
                        variable_stats[group] = {
                            'trades': 0,
                            'wins': 0,
                            'losses': 0,
                            'total_rr': 0.0,
                            'total_pnl': 0.0,
                            'gross_profit': 0.0,
                            'gross_loss': 0.0,
                            'win_amounts': [],
                            'loss_amounts': [],
                            'pnl_history': [],
                            'cumulative_pnl': [],
                            'running_pnl': 0.0,
                            'peak': 0.0,
                            'max_drawdown': 0.0,
                            'first_date': None,
                            'last_date': None,
                            'trades_data': []
                        }
                    
                    stats = variable_stats[group]
                    
                    # Track trade dates
                    if entry.date:
                        if stats['first_date'] is None or entry.date < stats['first_date']:
                            stats['first_date'] = entry.date
                        if stats['last_date'] is None or entry.date > stats['last_date']:
                            stats['last_date'] = entry.date
                    
                    # Update trade statistics
                    stats['trades'] += 1
                    stats['total_rr'] += entry.rr or 0.0
                    stats['total_pnl'] += entry.pnl or 0.0
                    stats['running_pnl'] += entry.pnl or 0.0
                    
                    # Track PnL history for drawdown calculation
                    stats['pnl_history'].append({
                        'date': entry.date.isoformat() if entry.date else None,
                        'pnl': entry.pnl or 0.0,
                        'cumulative': stats['running_pnl']
                    })
                    
                    # Update peak and drawdown
                    if stats['running_pnl'] > stats['peak']:
                        stats['peak'] = stats['running_pnl']
                    else:
                        drawdown = stats['peak'] - stats['running_pnl']
                        if drawdown > stats['max_drawdown']:
                            stats['max_drawdown'] = drawdown
                    
                    # Handle win/loss classification (skip zero PnL for win rate calculation)
                    if entry.pnl and entry.pnl != 0:
                        if entry.pnl > 0:
                            stats['wins'] += 1
                            stats['gross_profit'] += entry.pnl
                            stats['win_amounts'].append(entry.pnl)
                        else:
                            stats['losses'] += 1
                            loss = abs(entry.pnl)
                            stats['gross_loss'] += loss
                            stats['loss_amounts'].append(-loss)
                    
                    # Store trade data for later calculations
                    stats['trades_data'].append({
                        'date': entry.date.isoformat() if entry.date else None,
                        'pnl': entry.pnl or 0.0,
                        'rr': entry.rr or 0.0,
                        'symbol': entry.symbol,
                        'direction': entry.direction
                    })
        
        print(f"Variables analysis: processed {processed_entries} entries, skipped {skipped_entries} entries without variables")
        print(f"Found {len(variable_stats)} unique variable combinations")
        
        # Calculate additional metrics and format response
        result = []
        best_metric = {'value': None, 'metric': 'profit_factor', 'variable': None}
        total_trades = 0
        total_pnl = 0.0
        total_win_rate = 0.0
        total_profit_factor = 0.0
        variable_count = 0
        
        for label, data in variable_stats.items():
            wins = data['wins']
            losses = data['losses']
            total = data['trades']
            
            if total == 0:
                continue
                
            # Calculate basic metrics
            win_rate = (wins / (wins + losses) * 100) if (wins + losses) > 0 else 0.0
            avg_rr = data['total_rr'] / total if total > 0 else 0.0
            
            # Calculate profit factor
            profit_factor = 0.0
            if data['gross_loss'] > 0:
                profit_factor = data['gross_profit'] / data['gross_loss']
            elif data['gross_profit'] > 0:
                profit_factor = None  # Using None instead of float('inf') for JSON serialization
            
            # Calculate average win/loss
            avg_win = sum(data['win_amounts']) / len(data['win_amounts']) if data['win_amounts'] else 0.0
            avg_loss = sum(data['loss_amounts']) / len(data['loss_amounts']) if data['loss_amounts'] else 0.0
            
            # Calculate max win/loss
            max_win = max(data['win_amounts'], default=0.0)
            max_loss = max(data['loss_amounts'], default=0.0)
            
            # Calculate expectancy
            win_prob = wins / total if total > 0 else 0
            loss_prob = losses / total if total > 0 else 0
            expectancy = (win_prob * avg_win) - (loss_prob * avg_loss)
            
            # Calculate consistency score (0-1, higher is more consistent)
            consistency = 0.0
            if wins > 0 and losses > 0:
                win_std = (sum((x - avg_win) ** 2 for x in data['win_amounts']) / len(data['win_amounts'])) ** 0.5 if data['win_amounts'] else 0
                loss_std = (sum((x - avg_loss) ** 2 for x in data['loss_amounts']) / len(data['loss_amounts'])) ** 0.5 if data['loss_amounts'] else 0
                consistency = 1 / (1 + (win_std / avg_win if avg_win != 0 else 0) + (loss_std / avg_loss if avg_loss != 0 else 0))
            
            # Sort PnL history by date
            sorted_pnl = sorted(data['pnl_history'], key=lambda x: x['date'] or '')
            
            # Prepare cumulative PnL data for charting
            cumulative_pnl = []
            running_total = 0.0
            for trade in sorted_pnl:
                running_total += trade['pnl']
                cumulative_pnl.append({
                    'date': trade['date'],
                    'value': round(running_total, 2)
                })
            
            # Create variable stats object
            var_stats = {
                'variable': label,
                'trades': total,
                'wins': wins,
                'losses': losses,
                'win_rate': round(win_rate, 1),
                'avg_rr': round(avg_rr, 2),
                'pnl': round(data['total_pnl'], 2),
                'profit_factor': round(profit_factor, 2) if profit_factor is not None else None,
                'gross_profit': round(data['gross_profit'], 2),
                'gross_loss': round(data['gross_loss'], 2),
                'avg_win': round(avg_win, 2),
                'avg_loss': round(avg_loss, 2),
                'max_win': round(max_win, 2),
                'max_loss': round(-max_loss, 2) if max_loss != 0 else 0.0,
                'max_drawdown': round(abs(data['max_drawdown']), 2) if data['max_drawdown'] is not None else 0.0,
                'expectancy': round(expectancy, 2),
                'consistency_score': round(consistency, 2),
                'cumulative_pnl': cumulative_pnl,
                'first_trade_date': data['first_date'].strftime('%Y-%m-%d') if data['first_date'] else None,
                'latest_date': data['last_date'].strftime('%Y-%m-%d') if data['last_date'] else None,
                'is_combination': False,
                'variable_components': [label]
            }
            
            # Track best performing variable by profit factor
            if profit_factor is not None and (best_metric['value'] is None or profit_factor > best_metric['value']):
                best_metric = {
                    'value': profit_factor,
                    'metric': 'profit_factor',
                    'variable': label
                }
            
            # Update summary stats
            total_trades += total
            total_pnl += data['total_pnl']
            total_win_rate += win_rate
            total_profit_factor += profit_factor if profit_factor is not None else 0
            variable_count += 1
            
            result.append(var_stats)
        
        # Calculate averages for summary
        avg_win_rate = total_win_rate / variable_count if variable_count > 0 else 0
        avg_profit_factor = total_profit_factor / variable_count if variable_count > 0 else 0
        
        # Sort results by total PnL (descending) for better display
        result.sort(key=lambda x: x['pnl'], reverse=True)
        
        # Analyze variable combinations if requested
        combinations_result = []
        if combine_vars and len(entries) > 0:
            try:
                combinations_result = analyze_variable_combinations(entries, combination_level)
                print(f"Generated {len(combinations_result)} variable combinations")
                
                # Add combination stats to the result
                for combo in combinations_result:
                    combo['is_combination'] = True
                    
                    # Update best metric if this combination is better
                    if combo['profit_factor'] is not None and \
                       (best_metric['value'] is None or combo['profit_factor'] > best_metric['value']):
                        best_metric = {
                            'value': combo['profit_factor'],
                            'metric': 'profit_factor',
                            'variable': combo['combination'],
                            'is_combination': True
                        }
                    
                    # Add to summary stats
                    total_trades += combo['trades']
                    total_pnl += combo['pnl']
                    total_win_rate += combo['win_rate']
                    if combo['profit_factor'] is not None:
                        total_profit_factor += combo['profit_factor']
                        variable_count += 1
                
            except Exception as e:
                print(f"Error analyzing variable combinations: {str(e)}")
                import traceback
                traceback.print_exc()
        
        # Prepare final response
        response = {
            'variables': result,
            'combinations': combinations_result[:1000],  # Limit to top 1000 combinations
            'best_performing': best_metric,
            'stats_summary': {
                'total_trades': total_trades,
                'total_pnl': round(total_pnl, 2),
                'avg_win_rate': round(avg_win_rate, 1) if variable_count > 0 else 0.0,
                'avg_profit_factor': round(avg_profit_factor, 2) if variable_count > 0 else 0.0
            },
            'debug_info': {
                'total_entries_checked': len(entries),
                'entries_with_variables': processed_entries,
                'entries_without_variables': skipped_entries,
                'unique_variable_combinations': len(variable_stats),
                'variable_combinations_generated': len(combinations_result)
            }
        }

        print(f"Returning {len(result)} variable analysis results")
        return jsonify(response), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Variables analysis error: {str(e)}")
        return jsonify({'error': str(e)}), 500
        
@journal_bp.route('/symbol-analysis', methods=['GET'])
@jwt_required()
def symbol_analysis():
    """Return performance metrics grouped by symbol/pair for the current user"""
    try:
        user_id = int(get_jwt_identity())
        entries = (
            JournalEntry.query
            .filter_by(user_id=user_id)
            .all()
        )
        symbol_map = {}
        for e in entries:
            sym = (e.symbol or '').upper()
            if not sym:
                continue
            stats = symbol_map.setdefault(sym, {
                'trades': 0,
                'wins': 0,
                'losses': 0,
                'total_rr': 0.0,
                'total_pnl': 0.0,
                'gross_profit': 0.0,
                'gross_loss': 0.0,
                'first_date': None,
                'last_date': None
            })
            # Track earliest and latest trade dates for this symbol
            if e.date:
                if stats['first_date'] is None or e.date < stats['first_date']:
                    stats['first_date'] = e.date
                if stats['last_date'] is None or e.date > stats['last_date']:
                    stats['last_date'] = e.date
            if e.pnl == 0:
                # treat as break-even (ignore for win/loss pct but count trade)
                stats['trades']+=1
                continue
            stats['trades']+=1
            stats['total_rr']+= e.rr or 0.0
            stats['total_pnl'] += e.pnl or 0.0
            if e.pnl > 0:
                stats['wins']+=1
                stats['gross_profit'] += e.pnl
            else:
                stats['losses']+=1
                stats['gross_loss'] += abs(e.pnl)
 
        result = []
        for sym,d in symbol_map.items():
            wins = d['wins']
            losses = d['losses']
            total = d['trades']
            win_rate = (wins / (wins + losses) * 100) if (wins + losses) else 0.0
            avg_rr = d['total_rr'] / total if total else 0.0
            profit_factor = (d['gross_profit'] / d['gross_loss']) if d['gross_loss'] else (float('inf') if d['gross_profit'] else 0.0)
            result.append({
                'symbol': sym,
                'trades': total,
                'win_rate': round(win_rate, 1),
                'avg_rr': round(avg_rr, 2),
                'pnl': round(d['total_pnl'], 2),
                'profit_factor': None if not math.isfinite(profit_factor) else round(profit_factor, 2),
                'gross_profit': round(d['gross_profit'], 2),
                'gross_loss': round(d['gross_loss'], 2),
                'first_trade_date': d['first_date'].strftime('%Y-%m-%d') if d['first_date'] else None,
                'latest_date': d['last_date'].strftime('%Y-%m-%d') if d['last_date'] else None
            })
 
        return jsonify(result), 200
    except Exception as e:
        print(' symbol_analysis error:', e)
        return jsonify({'error': str(e)}), 500


# ─── Risk Summary ───────────────────────────────────────────────────────────
@journal_bp.route('/risk-summary', methods=['GET'])
@jwt_required()
def risk_summary():
    """Return distribution of R-multiples and risk stats for the current user.

    Response JSON
    {
        "r_multiples": [...],
        "avg_risk": 0.8,
        "avg_r_multiple": 0.25,
        "max_risk": 2.1,
        "over_risk_count": 3,
        "total_trades": 42
    }
    Optional query param:
      max_allowed (float) – threshold to flag trades whose risk exceeds this value (default 1.0)
    """
    try:
        user_id = int(get_jwt_identity())
        max_allowed = float(request.args.get('max_allowed', 1.0))

        # Fetch only the columns we need for performance
        trades = (
            JournalEntry.query
            .with_entities(JournalEntry.rr, JournalEntry.risk_amount)
            .filter_by(user_id=user_id)
            .all()
        )

        if not trades:
            return jsonify({
                'r_multiples': [],
                'avg_risk': None,
                'avg_r_multiple': None,
                'max_risk': None,
                'over_risk_count': 0,
                'total_trades': 0
            }), 200

        r_multiples = [float(t.rr) for t in trades if t.rr is not None]
        risks = [float(t.risk_amount) for t in trades if t.risk_amount is not None]

        avg_risk = sum(risks) / len(risks) if risks else None
        avg_r_multiple = sum(r_multiples) / len(r_multiples) if r_multiples else None
        max_risk = max(risks) if risks else None
        over_risk_count = sum(1 for r in risks if r > max_allowed)

        return jsonify({
            'r_multiples': r_multiples,
            'avg_risk': round(avg_risk, 4) if avg_risk is not None else None,
            'avg_r_multiple': round(avg_r_multiple, 4) if avg_r_multiple is not None else None,
            'max_risk': max_risk,
            'over_risk_count': over_risk_count,
            'total_trades': len(trades)
        }), 200

    except Exception as e:
        print("risk_summary error:", e)
        return jsonify({'error': str(e)}), 500

# ─── Performance Highlights ────────────────────────────────────────────────
@journal_bp.route('/performance-highlights', methods=['GET'])
@jwt_required()
def performance_highlights():
    """
    Return key performance highlights including best setup, best instrument, and best time of day.
    
    Response format:
    {
        "best_setup": {
            "name": "Setup Name",
            "pnl": 1234.56,
            "win_rate": 75.5,
            "trades": 12
        },
        "best_instrument": {
            "symbol": "BTC/USD",
            "pnl": 5678.90,
            "win_rate": 65.2,
            "trades": 23
        },
        "best_time_of_day": {
            "hour": 10,
            "formatted_time": "10:00 AM",
            "pnl": 3456.78,
            "win_rate": 72.3,
            "trades": 15
        },
        "hourly_performance": [
            {"hour": 0, "pnl": 100, "trades": 5, "win_rate": 60.0},
            ...
        ],
        "monthly_performance": [
            {
                "id": "2023-01",
                "name": "January 2023",
                "trades": 42,
                "return": 1234.56,
                "win_rate": 65.5,
                "weeklyData": [
                    {
                        "week": "2023-01",
                        "week_num": 1,
                        "year": 2023,
                        "start_date": "2023-01-01",
                        "end_date": "2023-01-07",
                        "formatted_range": "Jan 01 - Jan 07, 2023",
                        "pnl": 123.45,
                        "win_rate": 60.0,
                        "trades": 5
                    },
                    ...
                ]
            },
            ...
        ],
        "weekly_performance": [
            {
                "week": "2023-01",
                "week_num": 1,
                "year": 2023,
                "start_date": "2023-01-01",
                "end_date": "2023-01-07",
                "formatted_range": "Jan 01 - Jan 07, 2023",
                "pnl": 123.45,
                "win_rate": 60.0,
                "trades": 5
            },
            ...
        ]
    }
    """
    try:
        user_id = int(get_jwt_identity())
        print(f"\n=== Processing performance highlights for user {user_id} ===")
        
        # Get all trades for the user
        entries = JournalEntry.query.filter_by(user_id=user_id).all()
        print(f"Found {len(entries)} trades for user {user_id}")
        
        if not entries:
            print("No trades found for user, returning empty response")
            return jsonify({
                'best_setup': {'name': 'No data', 'pnl': 0, 'win_rate': 0, 'trades': 0},
                'best_instrument': {'symbol': 'No data', 'pnl': 0, 'win_rate': 0, 'trades': 0},
                'best_time_of_day': {'hour': 0, 'formatted_time': 'No data', 'pnl': 0, 'win_rate': 0, 'trades': 0},
                'best_week': {'week': 'No data', 'formatted_range': 'No data', 'pnl': 0, 'win_rate': 0, 'trades': 0},
                'best_month': {'id': 'no-data', 'name': 'No data', 'trades': 0, 'return': 0, 'win_rate': 0},
                'hourly_performance': [],
                'monthly_performance': [],
                'weekly_performance': []
            })
        
        # Helper function to calculate win rate
        def calculate_win_rate(trades):
            if not trades:
                return 0.0
            wins = sum(1 for t in trades if t.pnl > 0)
            return (wins / len(trades)) * 100
        
        # Initialize data structures
        setup_stats = {}
        instrument_stats = {}
        hourly_stats = {hour: [] for hour in range(24)}
        weekly_stats = {}
        monthly_stats = {}
        
        # Analyze trades
        for entry in entries:
            # Setup analysis
            setup = (entry.variables or {}).get('setup', 'No Setup')
            if setup not in setup_stats:
                setup_stats[setup] = []
            setup_stats[setup].append(entry)
            
            # Instrument analysis
            symbol = entry.symbol
            if symbol not in instrument_stats:
                instrument_stats[symbol] = []
            instrument_stats[symbol].append(entry)
            
            # Hourly analysis
            hour = entry.created_at.hour
            hourly_stats[hour].append(entry)
            
            # Weekly analysis
            week_key = f"{entry.created_at.isocalendar().year}-{entry.created_at.isocalendar().week:02d}"
            if week_key not in weekly_stats:
                weekly_stats[week_key] = {'trades': [], 'pnl': 0, 'wins': 0}
            weekly_stats[week_key]['trades'].append(entry)
            weekly_stats[week_key]['pnl'] += entry.pnl or 0
            if (entry.pnl or 0) > 0:
                weekly_stats[week_key]['wins'] += 1
            
            # Monthly analysis
            month_key = entry.created_at.strftime('%Y-%m')
            if month_key not in monthly_stats:
                monthly_stats[month_key] = {'trades': [], 'pnl': 0, 'wins': 0, 'weeks': {}}
            
            # Track weekly data within month
            if week_key not in monthly_stats[month_key]['weeks']:
                monthly_stats[month_key]['weeks'][week_key] = {'trades': [], 'pnl': 0, 'wins': 0}
                
            monthly_stats[month_key]['trades'].append(entry)
            monthly_stats[month_key]['pnl'] += entry.pnl or 0
            monthly_stats[month_key]['weeks'][week_key]['trades'].append(entry)
            monthly_stats[month_key]['weeks'][week_key]['pnl'] += entry.pnl or 0
            if (entry.pnl or 0) > 0:
                monthly_stats[month_key]['wins'] += 1
                monthly_stats[month_key]['weeks'][week_key]['wins'] += 1
        
        # Find best setup
        best_setup = None
        for setup, trades in setup_stats.items():
            total_pnl = sum(t.pnl or 0 for t in trades)
            win_rate = calculate_win_rate(trades)
            if best_setup is None or total_pnl > best_setup['pnl']:
                best_setup = {
                    'name': setup,
                    'pnl': round(total_pnl, 2),
                    'win_rate': round(win_rate, 1),
                    'trades': len(trades)
                }
        
        # Find best instrument
        best_instrument = None
        for symbol, trades in instrument_stats.items():
            total_pnl = sum(t.pnl or 0 for t in trades)
            win_rate = calculate_win_rate(trades)
            if best_instrument is None or total_pnl > best_instrument['pnl']:
                best_instrument = {
                    'symbol': symbol,
                    'pnl': round(total_pnl, 2),
                    'win_rate': round(win_rate, 1),
                    'trades': len(trades)
                }
        
        # Process hourly performance
        hourly_performance = []
        best_hour = None
        for hour, trades in hourly_stats.items():
            if not trades:
                hourly_performance.append({
                    'hour': hour,
                    'formatted_time': f"{hour:02d}:00",
                    'pnl': 0,
                    'win_rate': 0,
                    'trades': 0
                })
                continue
                
            total_pnl = sum(t.pnl or 0 for t in trades)
            win_rate = calculate_win_rate(trades)
            
            hour_data = {
                'hour': hour,
                'formatted_time': f"{hour:02d}:00",
                'pnl': round(total_pnl, 2),
                'win_rate': round(win_rate, 1),
                'trades': len(trades)
            }
            hourly_performance.append(hour_data)
            
            if best_hour is None or total_pnl > best_hour['pnl']:
                best_hour = hour_data
        
        # Process weekly performance
        weekly_performance = []
        best_week = None
        for week_key, week_data in weekly_stats.items():
            year, week_num = map(int, week_key.split('-'))
            week_start = datetime.strptime(f"{year}-{week_num}-1", "%Y-%W-%w")
            week_end = week_start + timedelta(days=6.9)
            
            week_trades = week_data['trades']
            total_pnl = week_data['pnl']
            win_rate = (week_data['wins'] / len(week_trades) * 100) if week_trades else 0
            
            week_metrics = {
                'week': week_key,
                'week_num': week_num,
                'year': year,
                'start_date': week_start.strftime('%Y-%m-%d'),
                'end_date': week_end.strftime('%Y-%m-%d'),
                'formatted_range': f"{week_start.strftime('%b %d')} - {week_end.strftime('%b %d, %Y')}",
                'pnl': round(total_pnl, 2),
                'win_rate': round(win_rate, 1),
                'trades': len(week_trades)
            }
            weekly_performance.append(week_metrics)
            
            if best_week is None or total_pnl > best_week['pnl']:
                best_week = week_metrics
        
        # Sort weekly performance by date (newest first)
        weekly_performance.sort(key=lambda x: x['start_date'], reverse=True)
        
        # Process monthly performance
        monthly_performance = []
        best_month = None
        print(f"\nProcessing monthly stats. Found {len(monthly_stats)} months of data")
        
        for month_key, month_data in sorted(monthly_stats.items(), reverse=True):
            print(f"\nProcessing month: {month_key}")
            print(f"Month data: {month_data}")
            
            try:
                month_date = datetime.strptime(month_key + '-01', '%Y-%m-%d')
                month_name = month_date.strftime('%B %Y')
                print(f"Formatted month name: {month_name}")
            except Exception as e:
                print(f"Error parsing month {month_key}: {str(e)}")
                continue
            
            month_trades = month_data['trades']
            total_pnl = month_data['pnl']
            win_rate = (month_data['wins'] / len(month_trades) * 100) if month_trades else 0
            
            # Process weekly data for this month
            weekly_data = []
            print(f"  Found {len(month_data.get('weeks', {}))} weeks in month {month_key}")
            
            for week_key, week_data in month_data.get('weeks', {}).items():
                print(f"  Processing week: {week_key}")
                print(f"  Week data: {week_data}")
                
                try:
                    year, week_num = map(int, week_key.split('-'))
                    week_start = datetime.strptime(f"{year}-{week_num}-1", "%Y-%W-%w")
                    week_end = week_start + timedelta(days=6.9)
                    print(f"  Week range: {week_start.date()} to {week_end.date()}")
                except Exception as e:
                    print(f"  Error processing week {week_key}: {str(e)}")
                    continue
                
                week_trades = week_data['trades']
                week_pnl = week_data['pnl']
                week_win_rate = (week_data['wins'] / len(week_trades) * 100) if week_trades else 0
                
                weekly_data.append({
                    'week': week_key,
                    'week_num': week_num,
                    'year': year,
                    'start_date': week_start.strftime('%Y-%m-%d'),
                    'end_date': week_end.strftime('%Y-%m-%d'),
                    'formatted_range': f"{week_start.strftime('%b %d')} - {week_end.strftime('%b %d, %Y')}",
                    'pnl': round(week_pnl, 2),
                    'win_rate': round(week_win_rate, 1),
                    'trades': len(week_trades)
                })
            
            # Sort weekly data by date (newest first)
            weekly_data.sort(key=lambda x: x['start_date'], reverse=True)
            
            month_metrics = {
                'id': month_key,
                'name': month_name,
                'trades': len(month_trades),
                'return': round(total_pnl, 2),
                'win_rate': round(win_rate, 1),
                'weeklyData': weekly_data
            }
            monthly_performance.append(month_metrics)
            
            if best_month is None or total_pnl > best_month['return']:
                best_month = month_metrics
        
        # Prepare the response
        response = {
            'best_setup': best_setup or {
                'name': 'No setups found',
                'pnl': 0,
                'win_rate': 0,
                'trades': 0
            },
            'best_instrument': best_instrument or {
                'symbol': 'No instruments found',
                'pnl': 0,
                'win_rate': 0,
                'trades': 0
            },
            'best_time_of_day': best_hour or {
                'hour': 0,
                'formatted_time': 'No data',
                'pnl': 0,
                'win_rate': 0,
                'trades': 0
            },
            'best_week': best_week or {
                'week': 'No data',
                'formatted_range': 'No data',
                'pnl': 0,
                'win_rate': 0,
                'trades': 0
            },
            'best_month': best_month or {
                'id': 'no-data',
                'name': 'No data',
                'trades': 0,
                'return': 0,
                'win_rate': 0
            },
            'hourly_performance': hourly_performance,
            'monthly_performance': monthly_performance,
            'weekly_performance': weekly_performance
        }
        
        return jsonify(response)
        
    except Exception as e:
        print(f"Error in performance_highlights: {str(e)}")
        return jsonify({"error": "Failed to generate performance highlights"}), 500


@journal_bp.route('/report-data', methods=['GET'])
@jwt_required()
def report_data():
    """Return a JSON payload with all analytics needed for report generation.
    Combines overall stats, symbol, strategy and tag breakdown in one call so the
    frontend can fetch once and build a PDF/HTML report.
    """
    try:
        # Reuse existing helper endpoints internally (call their functions) instead
        # of making HTTP requests.
        user_id = int(get_jwt_identity())

        entries = (
            JournalEntry.query
            .filter_by(user_id=user_id)
            .order_by(JournalEntry.created_at.asc())
            .all()
        )

        # Overall stats (reuse logic from stats() but simplify)
        total_trades = len(entries)
        total_pnl = sum(e.pnl or 0.0 for e in entries)
        wins = [e for e in entries if (e.pnl or 0.0) > 0]
        losses = [e for e in entries if (e.pnl or 0.0) < 0]
        win_rate = (len(wins) / total_trades * 100) if total_trades else 0.0
        avg_rr = (sum(e.rr or 0.0 for e in entries) / total_trades) if total_trades else 0.0

        # Symbol, strategy, tag breakdowns by calling internal funcs directly
        symbol_json, _ = symbol_analysis().__wrapped__(symbol_analysis) if False else (None, None)

        # Instead of hack, we'll replicate small logic quickly using earlier stats_map
        # Symbol map
        sym_map = {}
        for e in entries:
            sym = (e.symbol or '').upper()
            if not sym:
                continue
            d = sym_map.setdefault(sym, {'trades':0,'wins':0,'total_rr':0.0,'total_pnl':0.0})
            d['trades']+=1
            d['total_rr']+= e.rr or 0.0
            d['total_pnl'] += e.pnl or 0.0
            if (e.pnl or 0.0)>0:
                d['wins']+=1
        symbol_stats=[]
        for sym,d in sym_map.items():
            total=d['trades']; win_rate_s=(d['wins']/total*100) if total else 0.0
            symbol_stats.append({
                'symbol':sym,
                'trades':total,
                'win_rate':round(win_rate_s,1),
                'avg_rr':round(d['total_rr']/total if total else 0.0,2),
                'pnl':round(d['total_pnl'],2)
            })

        # Strategy map
        strat_map={}
        for e in entries:
            strat=e.strategy or 'Unspecified'
            d=strat_map.setdefault(strat,{'trades':0,'wins':0,'total_rr':0.0,'total_pnl':0.0})
            d['trades']+=1
            d['total_rr']+= e.rr or 0.0
            d['total_pnl']+= e.pnl or 0.0
            if (e.pnl or 0.0)>0:
                d['wins']+=1
        strategy_stats=[]
        for strat,d in strat_map.items():
            total=d['trades']; win_rate_s=(d['wins']/total*100) if total else 0.0
            strategy_stats.append({
                'strategy':strat,
                'trades':total,
                'win_rate':round(win_rate_s,1),
                'avg_rr':round(d['total_rr']/total if total else 0.0,2),
                'pnl':round(d['total_pnl'],2)
            })

        # Tag breakdown reuse logic from tag_breakdown above
        tag_data = tag_breakdown().__wrapped__(tag_breakdown) if False else None
        # We'll replicate quickly
        tag_stats_ret = []
        tag_map={}
        for e in entries:
            vars = e.variables or {}
            pnl_val = e.pnl or 0.0
            rr_val = e.rr or 0.0
            is_win = pnl_val>0
            for k,v in vars.items():
                labels = v if isinstance(v,list) else [v]
                for lab in labels:
                    t=tag_map.setdefault(k,{}).setdefault(lab,{'trades':0,'wins':0,'total_pnl':0.0,'total_rr':0.0})
                    t['trades']+=1
                    t['total_pnl']+=pnl_val
                    t['total_rr']+=rr_val
                    if is_win:
                        t['wins']+=1
        for k,lab_dict in tag_map.items():
            items=[]
            for lab,agg in lab_dict.items():
                tr=agg['trades']; win=(agg['wins']/tr*100) if tr else 0.0
                items.append({'label':lab,'trades':tr,'win_rate':round(win,1),'avg_pnl':round(agg['total_pnl']/tr if tr else 0.0,2),'avg_rr':round(agg['total_rr']/tr if tr else 0.0,2)})
            items.sort(key=lambda x:x['trades'],reverse=True)
            tag_stats_ret.append({'tag':k,'items':items})
        tag_stats_ret.sort(key=lambda g:sum(i['trades'] for i in g['items']),reverse=True)

        return jsonify({
            'overall': {
                'total_trades': total_trades,
                'total_pnl': round(total_pnl,2),
                'win_rate': round(win_rate,1),
                'avg_rr': round(avg_rr,2)
            },
            'symbols': symbol_stats,
            'strategies': strategy_stats,
            'tags': tag_stats_ret
        }), 200

    except Exception as e:
        print(' report_data error:', e)
        return jsonify({'error': str(e)}), 500

# ─── Exit Analysis ────────────────────────────────────────────────────────────

@journal_bp.route('/trade/<int:trade_id>/exit-analysis', methods=['GET'])
@jwt_required()
def exit_analysis(trade_id):
    """
    Fetch price data for a specific trade to analyze price movement relative to SL/TP.
    
    Returns:
        JSON with price data, entry/exit points, and SL/TP levels
    """
    try:
        user_id = int(get_jwt_identity())
        
        # Get the trade
        trade = JournalEntry.query.filter_by(id=trade_id, user_id=user_id).first()
        if not trade:
            return jsonify({"error": "Trade not found or access denied"}), 404
        
        # Skip if no symbol or entry/exit dates
        if not trade.symbol or not trade.date or not trade.exit_price:
            return jsonify({"error": "Incomplete trade data for analysis"}), 400
            
        # Convert symbol to yfinance format (e.g., BTC-USD for crypto)
        symbol = trade.symbol.replace('/', '-')
        if trade.instrument_type == 'crypto':
            symbol = f"{symbol}"
        
        # Set date range (1 day before entry to 1 day after exit)
        start_date = (trade.date - timedelta(days=1)).strftime('%Y-%m-%d')
        end_date = (trade.date + timedelta(days=1)).strftime('%Y-%m-%d')
        
        # Fetch 1m data for the trade period
        df = yf.download(
            tickers=symbol,
            start=start_date,
            end=end_date,
            interval='1m',
            progress=False
        )
        
        if df.empty:
            return jsonify({"error": f"No price data found for {symbol}"}), 404
        
        # Convert to list of dicts for JSON response
        price_data = []
        for idx, row in df.iterrows():
            price_data.append({
                'timestamp': idx.isoformat(),
                'open': float(row['Open']),
                'high': float(row['High']),
                'low': float(row['Low']),
                'close': float(row['Close']),
                'volume': int(row['Volume'])
            })
        
        # Prepare response
        response = {
            'trade': {
                'id': trade.id,
                'symbol': trade.symbol,
                'direction': trade.direction,
                'entry_price': float(trade.entry_price),
                'exit_price': float(trade.exit_price),
                'stop_loss': float(trade.stop_loss) if trade.stop_loss else None,
                'take_profit': float(trade.take_profit) if trade.take_profit else None,
                'entry_time': trade.date.isoformat(),
                'exit_time': trade.updated_at.isoformat() if hasattr(trade, 'updated_at') else None,
                'pnl': float(trade.pnl) if trade.pnl else 0.0
            },
            'price_data': price_data
        }
        
        return jsonify(response)
        
    except Exception as e:
        print(f"exit_analysis error: {str(e)}")
        return jsonify({"error": str(e)}), 500

# ─── Streak Analysis ───────────────────────────────────────────────────────
@journal_bp.route('/streaks', methods=['GET'])
@jwt_required()
def streak_analysis():
    """
    Calculate and return streak statistics for the current user's trades.
    
    Returns:
        JSON with streak statistics including current streak, longest winning/losing streaks,
        and distribution of streaks.
    """
    try:
        user_id = int(get_jwt_identity())
        
        # Get all trades ordered by date
        entries = (
            JournalEntry.query
            .filter_by(user_id=user_id)
            .order_by(JournalEntry.date.asc())
            .all()
        )
        
        if not entries:
            return jsonify({
                'total_trades': 0,
                'winning_trades': 0,
                'win_rate': 0,
                'current_streak': {'type': None, 'count': 0, 'start_date': None, 'end_date': None},
                'longest_winning_streak': {'count': 0, 'pnl': 0, 'start_date': None, 'end_date': None},
                'longest_losing_streak': {'count': 0, 'pnl': 0, 'start_date': None, 'end_date': None},
                'winning_streaks': [],
                'losing_streaks': []
            })
        
        # Initialize streak tracking
        current_streak = {'type': None, 'count': 0, 'start_date': None, 'end_date': None}
        winning_streaks = []
        losing_streaks = []
        
        # Track longest streaks
        longest_winning = {'count': 0, 'pnl': 0, 'start_date': None, 'end_date': None}
        longest_losing = {'count': 0, 'pnl': 0, 'start_date': None, 'end_date': None}
        
        # Counters for win rate
        winning_trades = 0
        valid_trades = 0  # Trades with valid PnL (not None)
        
        for entry in entries:
            if entry.pnl is None:
                continue  # Skip trades with no PnL
                
            valid_trades += 1
            is_win = entry.pnl > 0  # Only consider trades with PnL > 0 as wins
            if is_win:
                winning_trades += 1
            
            # Handle current streak
            if current_streak['type'] is None:
                # Start new streak
                current_streak = {
                    'type': 'winning' if is_win else 'losing',
                    'count': 1,
                    'start_date': entry.date.isoformat(),
                    'end_date': entry.date.isoformat(),
                    'pnl': float(entry.pnl) if entry.pnl else 0.0
                }
            elif (current_streak['type'] == 'winning' and is_win) or \
                 (current_streak['type'] == 'losing' and not is_win):
                # Continue current streak
                current_streak['count'] += 1
                current_streak['end_date'] = entry.date.isoformat()
                current_streak['pnl'] += float(entry.pnl) if entry.pnl else 0.0
            else:
                # End current streak and start new one - only keep streaks with count > 1
                if current_streak['count'] > 1:
                    if current_streak['type'] == 'winning':
                        winning_streaks.append(current_streak)
                        if current_streak['count'] > longest_winning['count']:
                            longest_winning = {
                                'count': current_streak['count'],
                                'pnl': current_streak['pnl'],
                                'start_date': current_streak['start_date'],
                                'end_date': current_streak['end_date']
                            }
                    else:
                        losing_streaks.append(current_streak)
                        if current_streak['count'] > longest_losing['count']:
                            longest_losing = {
                                'count': current_streak['count'],
                                'pnl': current_streak['pnl'],
                                'start_date': current_streak['start_date'],
                                'end_date': current_streak['end_date']
                            }
                
                # Start new streak
                current_streak = {
                    'type': 'winning' if is_win else 'losing',
                    'count': 1,
                    'start_date': entry.date.isoformat(),
                    'end_date': entry.date.isoformat(),
                    'pnl': float(entry.pnl) if entry.pnl else 0.0
                }
        
        # Don't forget to add the last streak if it's longer than 1 trade
        if current_streak['count'] > 1:
            if current_streak['type'] == 'winning':
                winning_streaks.append(current_streak)
                if current_streak['count'] > longest_winning['count']:
                    longest_winning = {
                        'count': current_streak['count'],
                        'pnl': current_streak['pnl'],
                        'start_date': current_streak['start_date'],
                        'end_date': current_streak['end_date']
                    }
            else:
                losing_streaks.append(current_streak)
                if current_streak['count'] > longest_losing['count']:
                    longest_losing = {
                        'count': current_streak['count'],
                        'pnl': current_streak['pnl'],
                        'start_date': current_streak['start_date'],
                        'end_date': current_streak['end_date']
                    }
        
        # Calculate win rate based on valid trades only
        win_rate = round(winning_trades / valid_trades * 100, 2) if valid_trades > 0 else 0
        
        # Prepare the response
        response = {
            'total_trades': len(entries),
            'valid_trades': valid_trades,  # Include count of trades with valid PnL
            'winning_trades': winning_trades,
            'win_rate': win_rate,
            'current_streak': {
                'type': current_streak['type'],
                'count': current_streak['count'],
                'start_date': current_streak['start_date'],
                'end_date': current_streak['end_date']
            },
            'longest_winning_streak': longest_winning,
            'longest_losing_streak': longest_losing,
            'winning_streaks': [{
                'count': s['count'],
                'start_date': s['start_date'],
                'end_date': s['end_date'],
                'pnl': s['pnl']
            } for s in winning_streaks],
            'losing_streaks': [{
                'count': s['count'],
                'start_date': s['start_date'],
                'end_date': s['end_date'],
                'pnl': s['pnl']
            } for s in losing_streaks]
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        print(f"Error in streak_analysis: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ─── Equity Analytics ────────────────────────────────────────────────────────
@journal_bp.route('/equities', methods=['GET'])
@jwt_required()
def get_equity_curve():
    """
    Return equity curve data and performance metrics for the current user.
    
    Response format:
    {
        "equity_curve": [
            {"date": "YYYY-MM-DD", "equity": float, "cumulative_pnl": float, "daily_return": float},
            ...
        ],
        "metrics": {
            "sharpe_ratio": float,
            "sortino_ratio": float,
            "max_drawdown": float,
            "max_drawdown_pct": float,
            "total_return": float,
            "annualized_return": float,
            "volatility": float,
            "win_rate": float,
            "profit_factor": float
        },
        "performance_by_period": {
            "daily": [{"date": "YYYY-MM-DD", "pnl": float, "return": float}],
            "weekly": [{"week_start": "YYYY-MM-DD", "pnl": float, "return": float}],
            "monthly": [{"month": "YYYY-MM", "pnl": float, "return": float}]
        }
    }
    """
    try:
        user_id = int(get_jwt_identity())
        
        # Get all trades for the user, ordered by date
        entries = (
            JournalEntry.query
            .filter_by(user_id=user_id)
            .order_by(JournalEntry.date.asc())
            .all()
        )
        
        if not entries:
            return jsonify({
                'equity_curve': [],
                'metrics': {},
                'performance_by_period': {'daily': [], 'weekly': [], 'monthly': []}
            })
        
        # Initialize data structures
        equity_curve = []
        daily_returns = []
        daily_pnl = []
        
        # Calculate cumulative P&L and equity curve
        cumulative_pnl = 0.0
        previous_date = None
        
        # First pass: group trades by date
        trades_by_date = {}
        for entry in entries:
            trade_date = entry.date.strftime('%Y-%m-%d') if entry.date else entry.created_at.strftime('%Y-%m-%d')
            if trade_date not in trades_by_date:
                trades_by_date[trade_date] = []
            trades_by_date[trade_date].append(entry)
        
        # Sort dates
        sorted_dates = sorted(trades_by_date.keys())
        
        # Calculate daily returns and build equity curve
        daily_returns = []
        daily_pnl = []
        equity_curve = []
        
        # Get initial equity (first day's closing equity)
        if trades_by_date:
            first_day_equity = sum(entry.pnl for entry in trades_by_date[sorted_dates[0]]) if trades_by_date[sorted_dates[0]][0].pnl is not None else 0
        else:
            first_day_equity = 0
            
        cumulative_pnl = 0.0
        for i, date in enumerate(sorted_dates):
            # Calculate daily P&L
            daily_total = sum(entry.pnl for entry in trades_by_date[date] if entry.pnl is not None)
            cumulative_pnl += daily_total
            
            # Calculate daily return as percentage of initial equity
            # This prevents inflated returns when account balance is low
            daily_return = daily_total / first_day_equity if first_day_equity != 0 else 0
            
            equity_curve.append({
                'date': date,
                'equity': cumulative_pnl,
                'cumulative_pnl': cumulative_pnl,
                'daily_return': daily_return
            })
            
            daily_returns.append(daily_return)
            daily_pnl.append(daily_total)
        
        # Calculate performance metrics
        if not daily_returns:
            return jsonify({
                'equity_curve': equity_curve,
                'metrics': {},
                'performance_by_period': {'daily': [], 'weekly': [], 'monthly': []}
            })
        
        import numpy as np
        
        # Calculate metrics
        returns = np.array(daily_returns)
        pnl = np.array(daily_pnl)
        
        # Sharpe Ratio (assuming 0% risk-free rate)
        sharpe_ratio = np.mean(returns) / (np.std(returns) or 1) * np.sqrt(252)  # Annualized
        
        # Sortino Ratio (only downside deviation)
        downside_returns = returns[returns < 0]
        downside_std = np.std(downside_returns) if len(downside_returns) > 0 else 0
        sortino_ratio = np.mean(returns) / (downside_std or 1) * np.sqrt(252) if downside_std else 0
        
        # Max Drawdown
        equity = np.array([e['equity'] for e in equity_curve])
        cummax = np.maximum.accumulate(equity)
        drawdown = (equity - cummax) / (cummax + 1e-10)  # Avoid division by zero
        max_drawdown_pct = abs(min(drawdown)) * 100
        max_drawdown = abs(min(equity - cummax))
        
        # Total return
        total_return = (equity[-1] - equity[0]) / (abs(equity[0]) or 1) * 100 if len(equity) > 1 else 0
        
        # Annualized return (simplified)
        trading_days = len(equity_curve)
        years = trading_days / 252  # Approximate trading days in a year
        annualized_return = ((1 + total_return/100) ** (1/years) - 1) * 100 if years > 0 else 0
        
        # Volatility (annualized)
        volatility = np.std(returns) * np.sqrt(252)
        
        # Win rate and profit factor
        winning_days = sum(1 for r in returns if r > 0)
        win_rate = (winning_days / len(returns)) * 100 if returns.any() else 0
        
        total_gain = sum(r for r in returns if r > 0)
        total_loss = abs(sum(r for r in returns if r < 0))
        profit_factor = total_gain / total_loss if total_loss > 0 else float('inf')
        
        # Group performance by period
        performance_daily = [
            {'date': e['date'], 'pnl': e['cumulative_pnl'] - (equity_curve[i-1]['cumulative_pnl'] if i > 0 else 0), 
             'return': e['daily_return']}
            for i, e in enumerate(equity_curve)
        ]
        
        # Weekly and monthly performance (simplified)
        performance_weekly = []
        performance_monthly = []
        
        # Group by week
        from collections import defaultdict
        weekly_data = defaultdict(list)
        monthly_data = defaultdict(list)
        
        for entry in equity_curve:
            dt = datetime.strptime(entry['date'], '%Y-%m-%d')
            week_start = (dt - timedelta(days=dt.weekday())).strftime('%Y-%m-%d')
            month_start = dt.strftime('%Y-%m-01')
            
            weekly_data[week_start].append(entry)
            monthly_data[month_start].append(entry)
        
        # Calculate weekly performance
        for week_start, week_entries in weekly_data.items():
            if len(week_entries) > 1:
                week_pnl = week_entries[-1]['cumulative_pnl'] - (week_entries[0]['cumulative_pnl'] - week_entries[0]['daily_return'])
                week_return = ((week_entries[-1]['cumulative_pnl'] / (week_entries[0]['cumulative_pnl'] - week_entries[0]['daily_return'])) - 1) * 100 \
                    if (week_entries[0]['cumulative_pnl'] - week_entries[0]['daily_return']) != 0 else 0
                performance_weekly.append({
                    'week_start': week_start,
                    'pnl': week_pnl,
                    'return': week_return
                })
        
        # Calculate monthly performance
        for month_start, month_entries in monthly_data.items():
            if len(month_entries) > 1:
                month_pnl = month_entries[-1]['cumulative_pnl'] - (month_entries[0]['cumulative_pnl'] - month_entries[0]['daily_return'])
                month_return = ((month_entries[-1]['cumulative_pnl'] / (month_entries[0]['cumulative_pnl'] - month_entries[0]['daily_return'])) - 1) * 100 \
                    if (month_entries[0]['cumulative_pnl'] - month_entries[0]['daily_return']) != 0 else 0
                performance_monthly.append({
                    'month': month_start,
                    'pnl': month_pnl,
                    'return': month_return
                })
        
        return jsonify({
            'equity_curve': equity_curve,
            'metrics': {
                'sharpe_ratio': round(float(sharpe_ratio), 2),
                'sortino_ratio': round(float(sortino_ratio), 2),
                'max_drawdown': round(float(max_drawdown), 2),
                'max_drawdown_pct': round(float(max_drawdown_pct), 2),
                'total_return': round(float(total_return), 2),
                'annualized_return': round(float(annualized_return), 2),
                'volatility': round(float(volatility), 2),
                'win_rate': round(float(win_rate), 2),
                'profit_factor': round(float(profit_factor), 2) if profit_factor != float('inf') else 'inf'
            },
            'performance_by_period': {
                'daily': performance_daily,
                'weekly': performance_weekly,
                'monthly': performance_monthly
            }
        })
        
    except Exception as e:
        print(f"Error in get_equity_curve: {str(e)}")
        return jsonify({
            'error': 'Failed to calculate equity curve',
            'details': str(e)
        }), 500

# ─── AI Summary ───────────────────────────────────────────────────────────────
@journal_bp.route('/ai-summary', methods=['POST'])
@jwt_required()
def ai_summary():
    if not openai.api_key:
        # Providing a helpful default message if the API key is not set
        return jsonify({'summary': """**AI Assistant is Offline**

To enable the AI-powered review, the site administrator needs to configure the OpenAI API key on the server.

In the meantime, you can continue to use all other features of your trading journal!"""})

    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        stats = data.get('stats')
        language = data.get('language', 'en')

        if not stats or stats.get('total_trades', 0) < 5:
            return jsonify({'summary': "Not enough trade data to generate a meaningful AI review. Keep trading and journaling, and the AI assistant will be ready to help after you've logged at least 5 trades."})

        # We simplify the stats to create a more focused and efficient prompt for the AI.
        prompt_stats = {
            "Total Trades": stats.get('total_trades'),
            "Win Rate (%)": stats.get('win_rate'),
            "Profit Factor": stats.get('profit_factor'),
            "Average R:R": stats.get('avg_rr'),
            "Expectancy ($)": stats.get('expectancy'),
            "Max Drawdown ($)": stats.get('max_drawdown'),
            "Sharpe Ratio": stats.get('sharpe_ratio'),
            "Total P&L ($)": stats.get('total_pnl'),
            "Average Win ($)": stats.get('avg_win'),
            "Average Loss ($)": stats.get('avg_loss'),
            "Max Consecutive Wins": stats.get('max_consecutive_wins'),
            "Max Consecutive Losses": stats.get('max_consecutive_losses'),
        }

        prompt = f"""
You are an expert trading coach providing a review for a trader. Analyze their performance based on these metrics:

{json.dumps(prompt_stats, indent=2)}

Your review should be concise and actionable. Structure your response as follows, using markdown for formatting:
1.  **Overall Assessment:** A one-sentence summary of the trading performance.
2.  **Key Strengths:** 2-3 bullet points on what the trader is doing well.
3.  **Areas for Improvement:** 2-3 bullet points on the main weaknesses.
4.  **Actionable Advice:** 3 concrete suggestions for what to focus on next.

Maintain a supportive and professional tone. Address the trader directly as 'you'.
"""
        if language == 'ar':
            prompt += "\nPlease write the entire review in Arabic."

        # In a real application, you would make a call to the OpenAI API here.
        # For this demonstration, we are returning a detailed, structured mock response.
        # Example API call (uncomment and adapt for production):
        # response = openai.ChatCompletion.create(
        #     model="gpt-4-turbo",
        #     messages=[
        #         {"role": "system", "content": "You are an expert trading coach."},
        #         {"role": "user", "content": prompt}
        #     ],
        #     temperature=0.7,
        #     max_tokens=500
        # )
        # summary = response.choices[0].message['content'].strip()

        # Mocked responses for demonstration purposes:
        if language == 'ar':
            summary = f"""**تقييم عام:**
يُظهر أداؤك أساسًا متينًا مع استراتيجية مربحة, ولكن هناك إمكانية واضحة لتعزيز الاتساق وإدارة المخاطر بشكل أكثر فعالية.

**نقاط القوة الرئيسية:**
*   **الربحية:** استراتيجيتك مربحة بشكل أساسي, ويتضح ذلك من خلال إجمالي ربح وخسارة إيجابي قدره ${stats.get('total_pnl', 0):.2f} وتوقع صحي.
*   **جودة الصفقات الرابحة:** أنت تتفوق في ترك صفقاتك الرابحة تستمر, حيث أن متوسط ربحك (${stats.get('avg_win', 0):.2f}) أكبر بكثير من متوسط خسارتك (${stats.get('avg_loss', 0):.2f}). هذه سمة مميزة للتداول الناجح.

**مجالات للتحسين:**
*   **معدل الربح:** يمكن تحسين معدل ربح بنسبة {stats.get('win_rate', 0)}%. قد يشير هذا إلى أنك تدخل الصفقات قبل الأوان أو تختار صفقات ذات احتمالية أقل.
*   **إدارة التراجع:** يشير أقصى تراجع لديك والبالغ ${stats.get('max_drawdown', 0):.2f} إلى أنك قد تخاطر كثيرًا في صفقات معينة, مما قد يؤثر على نمو رأس مالك على المدى الطويل.

**نصائح قابلة للتنفيذ:**
1.  **صقل معايير الدخول الخاصة بك:** قبل الدخول في صفقة, اسأل نفسك عما إذا كانت تلبي جميع معايير الإعداد المثالي لديك. كن أكثر انتقائية لزيادة معدل ربحك بشكل طبيعي.
2.  **توحيد المخاطر الخاصة بك:** قم بتنفيذ استراتيجية متسقة لتحديد حجم المركز. على سبيل المثال, لا تخاطر بأكثر من 1٪ من رأس مال التداول الخاص بك في أي صفقة واحدة للحفاظ على التراجعات تحت السيطرة.
3.  **حلل صفقاتك الخاسرة:** استخدم دفتر يومياتك للعثور على مواضيع مشتركة بين خسائرك. هل تحدث في وقت معين من اليوم؟ في حالة سوق معينة؟ استخدم هذه الرؤية لتجنب تكرار الأخطاء.

واصل الجهد المنضبط. أنت على الطريق الصحيح لتحقيق أهدافك في التداول!"""
        else:
            summary = f"""**Overall Assessment:**
Your performance shows a solid foundation with a profitable strategy, but there's clear potential to enhance consistency and manage risk more effectively.

**Key Strengths:**
*   **Profitability:** Your strategy is fundamentally profitable, as evidenced by a positive total P&L of ${stats.get('total_pnl', 0):.2f} and a healthy expectancy.
*   **Winning Trade Quality:** You excel at letting your winning trades run, with an average win (${stats.get('avg_win', 0):.2f}) significantly larger than your average loss (${stats.get('avg_loss', 0):.2f}). This is a hallmark of successful trading.

**Areas for Improvement:**
*   **Win Rate:** Your win rate of {stats.get('win_rate', 0)}% can be improved. This might indicate that you're entering trades too early or choosing trades with lower probability.
*   **Drawdown Management:** Your maximum drawdown of ${stats.get('max_drawdown', 0):.2f} suggests that you might be risking too much in certain trades, which could impact your capital growth over time.

**Actionable Advice:**
1.  **Refine Your Entry Criteria:** Before entering a trade, ask yourself if it meets all your ideal setup criteria. Be more selective to naturally increase your win rate.
2.  **Unify Your Risk Management:** Implement a consistent strategy for position sizing. For example, never risk more than 1% of your trading capital in any single trade to keep drawdowns under control.
3.  **Analyze Your Losing Trades:** Use your journal to find common themes among your losses. Do they happen at a specific time of day? In a particular market condition? Use this insight to avoid repeating mistakes.

Keep up the disciplined effort. You're on the right path to achieving your trading goals!"""

        return jsonify({'summary': summary})

    except Exception as e:
        print(f"[AI-SUMMARY-ERROR] {e}")
        return jsonify({'error': 'An unexpected error occurred while generating the AI summary.'}), 500


# ─── Shared import parser ────────────────────────────────────────────────────
def parse_trades_dataframe(df):
    """Parse a pandas DataFrame into a list[dict] trade objects.
    We attempt to map common broker column names to our internal fields.
    Unknown columns are stored in `extra_data` or as variables.
    """
    # Make a copy to avoid modifying the original
    df = df.copy()
    
    # Store original column names for reference
    original_headers = {col.lower(): col for col in df.columns}
    
    # Normalise headers (strip, lower) for processing
    df.columns = [c.strip().lower() for c in df.columns]

    # Heuristic mapping - only for core fields that we need to identify
    core_fields = {
        'symbol': ['symbol', 'pair', 'instrument'],
        'direction': ['type', 'side', 'direction'],
        'entry_price': ['entry price', 'open', 'open price', 'price open'],
        'exit_price': ['exit price', 'close', 'close price', 'price close'],
        'quantity': ['volume', 'qty', 'size', 'lots', 'quantity'],
        'date': ['date', 'open time', 'entry time', 'datetime', 'trade time', 'close time'],
        'time': ['time', 'entry time', 'close time', 'hour', 'trade time'],
        'pnl': ['pnl', 'profit', 'net profit', 'p&l'],
        'rr': ['rr', 'r:r', 'riskreward', 'risk reward', 'risk/reward'],
    }
    
    # Fields that should be excluded from variables
    excluded_from_vars = set()
    for field, aliases in core_fields.items():
        excluded_from_vars.update(aliases)
    excluded_from_vars.update(['id', 'notes', 'tags', 'variables', 'extra_data', 'created_at', 'updated_at'])

    # Build reverse lookup for core fields
    reverse_lookup = {}
    for k, aliases in core_fields.items():
        for alias in aliases:
            reverse_lookup[alias] = k

    # Try to automatically detect date/time columns
    date_columns = []
    time_columns = []
    datetime_columns = []
    
    for col in df.columns:
        col_lower = col.lower()
        if any(x in col_lower for x in ['date', 'time', 'datetime']):
            # Check if column contains datetime strings
            sample = df[col].dropna().head(10).astype(str)
            if sample.empty:
                continue
                
            # Check for datetime format (e.g., '2023-01-01 14:30:00')
            if sample.str.match(r'\d{4}[-/]\d{1,2}[-/]\d{1,2}[T\s]\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:[+-]\d{2}:?\d{2}|Z)?').any():
                datetime_columns.append(col)
            # Check for date format (e.g., '2023-01-01')
            elif sample.str.match(r'\d{4}[-/]\d{1,2}[-/]\d{1,2}').any():
                date_columns.append(col)
            # Check for time format (e.g., '14:30:00')
            elif sample.str.match(r'\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?').any():
                time_columns.append(col)

    trades = []
    for _, row in df.iterrows():
        trade = {
            'symbol': None,
            'direction': None,
            'entry_price': None,
            'exit_price': None,
            'quantity': 1.0,
            'date': None,
            'time': None,
            'datetime': None,
            'pnl': None,
            'rr': None,
            'extra_data': {},
            'variables': {}
        }
        
        # Map known columns and collect variables
        for col in df.columns:
            if pd.isna(row[col]) or row[col] == '':
                continue
                
            col_lower = col.lower()
            
            # Check if this is a core field
            if col_lower in reverse_lookup:
                field = reverse_lookup[col_lower]
                trade[field] = row[col]
            # Only include non-core, non-excluded fields as variables
            elif col_lower not in excluded_from_vars:
                # Use the original column name from the import file and convert to lowercase
                original_col = original_headers.get(col, col).lower()
                # Convert the value to lowercase if it's a string, or process lists of strings
                if isinstance(row[col], str):
                    trade['variables'][original_col] = row[col].lower() if pd.notna(row[col]) and str(row[col]).strip() else row[col]
                elif isinstance(row[col], list):
                    # Handle lists of strings
                    trade['variables'][original_col] = [
                        str(item).lower().strip() 
                        for item in row[col] 
                        if pd.notna(item) and str(item).strip()
                    ]
                else:
                    trade['variables'][original_col] = row[col]
            else:
                # Store in extra_data
                trade['extra_data'][col] = row[col]
        
        # Handle date/time parsing
        if 'datetime' not in trade or not trade['datetime']:
            # Try to combine separate date and time columns
            date_val = trade.get('date')
            time_val = trade.get('time')
            
            if date_val and time_val:
                try:
                    # Convert to string in case they're pandas Timestamp objects
                    date_str = str(date_val).strip()
                    time_str = str(time_val).strip()
                    
                    # Handle different date formats
                    if 'T' in date_str:  # ISO format
                        trade['datetime'] = date_str
                    else:
                        # Combine date and time
                        trade['datetime'] = f"{date_str} {time_str}"
                except Exception as e:
                    print(f"Error combining date and time: {e}")
                    trade['datetime'] = str(date_val)
        
        # If we still don't have a datetime, try to parse the date
        if 'datetime' not in trade or not trade['datetime']:
            if 'date' in trade and trade['date']:
                trade['datetime'] = str(trade['date'])
        
        # Clean up the trade dictionary
        if 'date' in trade and not trade['date']:
            del trade['date']
        if 'time' in trade and not trade['time']:
            del trade['time']
            
        trades.append(trade)
    
    return trades

# ─── Import preview endpoint ────────────────────────────────────────────────
@journal_bp.route('/import/preview', methods=['POST'])
@jwt_required()
def import_preview():
    """Upload a CSV or Excel file & return the first 20 parsed trades for preview."""
    if 'file' not in request.files:
        return jsonify({'error': 'No file field'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400

    try:
        # Read into pandas depending on extension
        if file.filename.lower().endswith('.csv'):
            df = pd.read_csv(file)
        else:
            df = pd.read_excel(file)

        preview_df = df.head(20)
        trades = parse_trades_dataframe(preview_df)
        # Replace NaN with None for JSON serialization
        sanitized_df = preview_df.where(pd.notnull(preview_df), None)
        raw_rows = sanitized_df.to_dict(orient='records')

        import numpy as np
        # Helper to sanitize any NaN/inf values in arbitrary structures
        def _sanitize(value):
            # Replace all NaN/Inf or numpy.nan with None so JSON is valid
            if value is None:
                return None
            if isinstance(value,(float,int)):
                if isinstance(value,float):
                    if np.isnan(value) or np.isinf(value):
                        return None
                return value
            if isinstance(value,np.number):
                if np.isnan(value) or np.isinf(value):
                    return None
                return value.item()
            if isinstance(value, (list, tuple, set)):
                return [_sanitize(v) for v in value]
            if isinstance(value, dict):
                return {k:_sanitize(v) for k,v in value.items()}
            return value

        trades = [_sanitize(t) for t in trades]
        # Basic duplicate detection within preview (same symbol+date+direction+entry)
        seen = set()
        for t in trades:
            key = (t.get('symbol'), t.get('direction'), t.get('entry_price'), t.get('date'))
            if key in seen:
                t['duplicate'] = True
            else:
                t['duplicate'] = False
                seen.add(key)
        payload = _sanitize({'trades': trades, 'raw_rows': raw_rows, 'columns': list(df.columns)})
        import json
        return Response(json.dumps(payload, allow_nan=False), mimetype='application/json')

    except Exception as e:
        print(' import_preview error:', e)
        return jsonify({'error': str(e)}), 500

@journal_bp.route('/variable-breakdown', methods=['GET'])
@jwt_required()
def variable_breakdown():
    """
    Return performance metrics grouped by values of a specific variable key.
    
    Query Parameters:
        key (str): The variable key to group by (e.g., 'var1', 'var2', etc.)
        from_date (str, optional): Filter trades on or after this date (YYYY-MM-DD)
        to_date (str, optional): Filter trades on or before this date (YYYY-MM-DD)
        timeframe (str, optional): Filter trades by timeframe ('all', 'month', 'year')
        
    Returns:
        JSON response with performance metrics grouped by variable values
    """
    try:
        user_id = int(get_jwt_identity())
        variable_key = request.args.get('key', 'var1')  # Default to 'var1' if not specified
        
        # Get date filters
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        timeframe = request.args.get('timeframe', 'all')
        
        # Base query
        query = JournalEntry.query.filter_by(user_id=user_id)
        
        # Apply date filters
        if from_date:
            try:
                from_date = datetime.strptime(from_date, '%Y-%m-%d').date()
                query = query.filter(JournalEntry.date >= from_date)
            except ValueError:
                return jsonify({'error': 'Invalid from_date format. Use YYYY-MM-DD'}), 400
                
        if to_date:
            try:
                to_date = datetime.strptime(to_date, '%Y-%m-%d').date()
                query = query.filter(JournalEntry.date <= to_date)
            except ValueError:
                return jsonify({'error': 'Invalid to_date format. Use YYYY-MM-DD'}), 400
                
        # Apply timeframe filter
        if timeframe != 'all':
            today = date.today()
            if timeframe == 'month':
                first_day = today.replace(day=1)
                query = query.filter(JournalEntry.date >= first_day)
            elif timeframe == 'year':
                first_day = today.replace(month=1, day=1)
                query = query.filter(JournalEntry.date >= first_day)
        
        # Get all trades
        entries = query.all()
        
        # Group trades by variable value
        variable_stats = {}
        
        for entry in entries:
            if not entry.variables or variable_key not in entry.variables:
                continue
                
            value = str(entry.variables[variable_key])
            if not value:  # Skip empty values
                continue
                
            if value not in variable_stats:
                variable_stats[value] = {
                    'trades': 0,
                    'wins': 0,
                    'losses': 0,
                    'total_rr': 0.0,
                    'total_pnl': 0.0,
                    'gross_profit': 0.0,
                    'gross_loss': 0.0,
                    'first_date': None,
                    'last_date': None,
                    'win_amounts': [],
                    'loss_amounts': [],
                    'pnl_history': [],
                    'running_pnl': 0.0,
                    'peak': 0.0,
                    'max_drawdown': 0.0
                }
            
            stats = variable_stats[value]
            stats['trades'] += 1
            
            # Track dates
            if entry.date:
                if stats['first_date'] is None or entry.date < stats['first_date']:
                    stats['first_date'] = entry.date
                if stats['last_date'] is None or entry.date > stats['last_date']:
                    stats['last_date'] = entry.date
            
            # Skip trades with no PnL for calculations
            if entry.pnl is None:
                continue
                
            # Track PnL and RR
            stats['total_pnl'] += entry.pnl
            stats['running_pnl'] += entry.pnl
            if entry.rr:
                stats['total_rr'] += entry.rr
            
            # Track PnL history for drawdown calculation
            stats['pnl_history'].append({
                'date': entry.date.isoformat() if entry.date else None,
                'pnl': entry.pnl or 0.0,
                'cumulative': stats['running_pnl']
            })
            
            # Update peak and drawdown
            if stats['running_pnl'] > stats['peak']:
                stats['peak'] = stats['running_pnl']
            else:
                drawdown = stats['peak'] - stats['running_pnl']
                if drawdown > stats['max_drawdown']:
                    stats['max_drawdown'] = drawdown
            
            # Track wins/losses and amounts
            if entry.pnl > 0:
                stats['wins'] += 1
                stats['gross_profit'] += entry.pnl
                stats['win_amounts'].append(entry.pnl)
            else:
                stats['losses'] += 1
                loss = abs(entry.pnl)
                stats['gross_loss'] += loss
                stats['loss_amounts'].append(loss)
        
        # Calculate metrics for each variable value
        result = []
        best_metric = {'value': None, 'metric': 'profit_factor', 'variable': None}
        total_trades = 0
        total_pnl = 0.0
        total_win_rate = 0.0
        total_profit_factor = 0.0
        variable_count = 0
        
        for value, data in variable_stats.items():
            wins = data['wins']
            losses = data['losses']
            total = data['trades']
            
            if total == 0:
                continue
                
            # Calculate basic metrics
            win_rate = (wins / (wins + losses) * 100) if (wins + losses) > 0 else 0.0
            avg_rr = data['total_rr'] / total if total > 0 else 0.0
            
            # Calculate profit factor
            profit_factor = None
            if data['gross_loss'] > 0:
                profit_factor = data['gross_profit'] / data['gross_loss']
            elif data['gross_profit'] > 0:
                profit_factor = float('inf')
            
            # Calculate average win/loss
            avg_win = sum(data['win_amounts']) / len(data['win_amounts']) if data['win_amounts'] else 0.0
            avg_loss = sum(data['loss_amounts']) / len(data['loss_amounts']) if data['loss_amounts'] else 0.0
            
            # Calculate max win/loss
            max_win = max(data['win_amounts'], default=0.0)
            max_loss = max(data['loss_amounts'], default=0.0)
            
            # Calculate expectancy
            win_prob = wins / total if total > 0 else 0
            loss_prob = losses / total if total > 0 else 0
            expectancy = (win_prob * avg_win) - (loss_prob * avg_loss)
            
            # Calculate consistency score (0-1, higher is more consistent)
            consistency = 0.0
            if wins > 0 and losses > 0:
                win_std = (sum((x - avg_win) ** 2 for x in data['win_amounts']) / len(data['win_amounts'])) ** 0.5 if data['win_amounts'] else 0
                loss_std = (sum((x - avg_loss) ** 2 for x in data['loss_amounts']) / len(data['loss_amounts'])) ** 0.5 if data['loss_amounts'] else 0
                consistency = 1 / (1 + (win_std / avg_win if avg_win != 0 else 0) + (loss_std / avg_loss if avg_loss != 0 else 0))
            
            # Sort PnL history by date
            sorted_pnl = sorted(data['pnl_history'], key=lambda x: x['date'] or '')
            
            # Prepare cumulative PnL data for charting
            cumulative_pnl = []
            running_total = 0.0
            for trade in sorted_pnl:
                running_total += trade['pnl']
                cumulative_pnl.append({
                    'date': trade['date'],
                    'value': round(running_total, 2)
                })
            
            # Create stats object for this variable value
            value_stats = {
                'value': value,
                'trades': total,
                'wins': wins,
                'losses': losses,
                'win_rate': round(win_rate, 1),
                'avg_rr': round(avg_rr, 2),
                'pnl': round(data['total_pnl'], 2),
                'profit_factor': round(profit_factor, 2) if profit_factor is not None and profit_factor != float('inf') else None,
                'gross_profit': round(data['gross_profit'], 2),
                'gross_loss': round(data['gross_loss'], 2),
                'avg_win': round(avg_win, 2),
                'avg_loss': round(avg_loss, 2),
                'max_win': round(max_win, 2),
                'max_loss': round(-max_loss, 2) if max_loss != 0 else 0.0,
                'max_drawdown': round(abs(data['max_drawdown']), 2) if data['max_drawdown'] is not None else 0.0,
                'expectancy': round(expectancy, 2),
                'consistency_score': round(consistency, 2),
                'cumulative_pnl': cumulative_pnl,
                'first_trade_date': data['first_date'].strftime('%Y-%m-%d') if data['first_date'] else None,
                'latest_date': data['last_date'].strftime('%Y-%m-%d') if data['last_date'] else None
            }
            
            # Track best performing variable by profit factor
            if profit_factor is not None and (best_metric['value'] is None or profit_factor > best_metric['value']):
                best_metric = {
                    'value': profit_factor,
                    'metric': 'profit_factor',
                    'variable': value
                }
            
            # Update summary stats
            total_trades += total
            total_pnl += data['total_pnl']
            total_win_rate += win_rate
            if profit_factor is not None and profit_factor != float('inf'):
                total_profit_factor += profit_factor
            variable_count += 1
            
            result.append(value_stats)
        
        # Calculate averages for summary
        avg_win_rate = total_win_rate / variable_count if variable_count > 0 else 0
        avg_profit_factor = total_profit_factor / variable_count if variable_count > 0 else 0
        
        # Sort results by total trades (descending)
        result.sort(key=lambda x: x['trades'], reverse=True)
        
        # Prepare final response
        response = {
            'variable_key': variable_key,
            'values': result,
            'best_performing': best_metric,
            'stats_summary': {
                'total_trades': total_trades,
                'total_pnl': round(total_pnl, 2),
                'avg_win_rate': round(avg_win_rate, 1),
                'avg_profit_factor': round(avg_profit_factor, 2)
            }
        }

        return jsonify(response), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500