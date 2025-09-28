document.addEventListener('DOMContentLoaded', () => {
  // Initialize Chart.js for CBAM Tax Projection
  const ctx = document.getElementById('cbamChart').getContext('2d');
  const cbamChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Scope 1', 'Scope 2', 'Scope 3'],
      datasets: [
        {
          label: 'Tax Projection (RM)',
          data: [500, 1200, 800], // Example data, replace with dynamic values
          backgroundColor: ['#16a34a', '#4ade80', '#86efac'],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `RM ${context.raw}`;
            },
          },
        },
      },
    },
  });

  // Initialize Tippy.js for tooltips
  tippy('[data-tippy-content]', {
    theme: 'light',
    animation: 'scale',
    duration: [200, 150],
  });
});