# Reimport os since it's been cleared
import os

# Define subpages again
analytics_subpages = [
    "Overview", "Equity", "Calendar", "Highlights",
    "Performance", "Breakdowns", "RecentTrades"
]

# Define the directory path
directory = "/mnt/data/src/pages/analytics"
os.makedirs(directory, exist_ok=True)

# Template function for each analytics subpage
def template(name):
    return f"""\
import React from 'react';

export default function {name}() {{
  return (
    <div className="p-6 max-w-7xl mx-auto bg-white shadow rounded-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">{name} Page</h1>
      <p className="text-gray-600">This is the {name.lower()} analytics section.</p>
    </div>
  );
}}
"""

# Create the files
file_paths = []
for name in analytics_subpages:
    file_path = os.path.join(directory, f"{name}.jsx")
    with open(file_path, "w") as f:
        f.write(template(name))
    file_paths.append(file_path)

file_paths
