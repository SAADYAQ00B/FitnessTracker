import api from './api';

export const downloadCSVReport = async (type: string = 'all') => {
  const response = await api.get(`/reports/csv?type=${type}`, { responseType: 'blob' });
  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fitness_report_${type}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

export const getReportSummary = async () => {
  const response = await api.get('/reports/summary');
  return response.data;
};

export const printPDFReport = async () => {
  const report = await getReportSummary();
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Please allow popups to generate and print your PDF report.");
    return;
  }

  const workoutsHtml = report.recentWorkouts && report.recentWorkouts.length > 0
    ? report.recentWorkouts.map((w: any) => `
        <tr>
          <td>${new Date(w.date).toLocaleDateString()}</td>
          <td><strong>${w.title}</strong></td>
          <td>${w.type || 'Strength'}</td>
          <td>${w.duration} min</td>
          <td>${w.stats || '-'}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="5" style="text-align:center; color:#888;">No workout sessions completed yet.</td></tr>';

  const mealsHtml = report.recentMeals && report.recentMeals.length > 0
    ? report.recentMeals.map((m: any) => `
        <tr>
          <td>${new Date(m.date).toLocaleDateString()}</td>
          <td><span class="badge">${m.type}</span></td>
          <td><strong>${m.food}</strong></td>
          <td>${m.calories} kcal</td>
          <td>${m.protein}g P · ${m.carbs}g C · ${m.fats}g F</td>
        </tr>
      `).join('')
    : '<tr><td colspan="5" style="text-align:center; color:#888;">No meals logged yet.</td></tr>';

  const progressHtml = report.progressHistory && report.progressHistory.length > 0
    ? report.progressHistory.map((p: any) => `
        <tr>
          <td>${new Date(p.date).toLocaleDateString()}</td>
          <td>${p.weight} kg</td>
          <td>${p.bodyFat ? p.bodyFat + '%' : '-'}</td>
          <td>${p.waist ? p.waist + ' cm' : '-'}</td>
          <td>${p.benchPress ? p.benchPress + ' kg' : '-'}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="5" style="text-align:center; color:#888;">No measurements logged yet.</td></tr>';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Fitness & Nutrition Report - ${report.user.name}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111; padding: 40px; margin: 0; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #a3e635; padding-bottom: 20px; margin-bottom: 25px; }
          .brand { font-size: 24px; font-weight: 900; color: #166534; }
          .title { font-size: 28px; font-weight: 800; margin: 0; }
          .sub { font-size: 13px; color: #666; margin-top: 4px; }
          .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
          .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; }
          .stat-card small { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; }
          .stat-card strong { display: block; font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 4px; }
          h2 { font-size: 16px; font-weight: 700; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-top: 30px; margin-bottom: 15px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px; }
          th { text-align: left; background: #f1f5f9; padding: 10px; font-weight: 700; color: #334155; }
          td { padding: 10px; border-bottom: 1px solid #f1f5f9; }
          .badge { display: inline-block; padding: 2px 8px; background: #dcfce7; color: #166534; font-size: 11px; font-weight: 700; border-radius: 4px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; text-align: right;">
          <button onclick="window.print()" style="background:#16a34a; color:white; border:none; padding:10px 20px; font-size:14px; font-weight:bold; border-radius:6px; cursor:pointer;">
            Print / Save as PDF
          </button>
        </div>

        <div class="header">
          <div>
            <div class="brand">FITNESSTRACKER</div>
            <h1 class="title">Fitness & Nutrition Report</h1>
            <p class="sub">Generated on ${new Date(report.generatedAt).toLocaleDateString()} for <strong>${report.user.name}</strong> (${report.user.email})</p>
          </div>
          <div style="text-align: right;">
            <p style="margin:0; font-size: 14px; font-weight: 700;">Level ${report.user.level || 1}</p>
            <p style="margin:2px 0 0 0; font-size: 12px; color:#64748b;">${report.user.xp || 0} Total XP</p>
          </div>
        </div>

        <div class="stat-grid">
          <div class="stat-card">
            <small>Current Weight</small>
            <strong>${report.stats.currentWeight ? report.stats.currentWeight + ' kg' : '--'}</strong>
          </div>
          <div class="stat-card">
            <small>Sessions Completed</small>
            <strong>${report.stats.totalSessionsCompleted}</strong>
          </div>
          <div class="stat-card">
            <small>Volume Lifted</small>
            <strong>${(report.stats.totalVolumeLifted || 0).toLocaleString()} kg</strong>
          </div>
          <div class="stat-card">
            <small>Avg. Calories / Day</small>
            <strong>${report.stats.avgCalories ? report.stats.avgCalories + ' kcal' : '--'}</strong>
          </div>
        </div>

        <h2>Recent Completed Workouts</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Workout Title</th>
              <th>Category</th>
              <th>Duration</th>
              <th>Stats / Volume</th>
            </tr>
          </thead>
          <tbody>${workoutsHtml}</tbody>
        </table>

        <h2>Recent Nutrition Logs</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Meal Type</th>
              <th>Food Item</th>
              <th>Calories</th>
              <th>Macros</th>
            </tr>
          </thead>
          <tbody>${mealsHtml}</tbody>
        </table>

        <h2>Progress & Measurements</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Weight</th>
              <th>Body Fat</th>
              <th>Waist</th>
              <th>Bench Press PR</th>
            </tr>
          </thead>
          <tbody>${progressHtml}</tbody>
        </table>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};
