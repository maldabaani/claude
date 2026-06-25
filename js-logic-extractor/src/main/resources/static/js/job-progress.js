(function () {
  const jobId = document.body.dataset.jobId;
  const STEP_ORDER = ['PENDING', 'SCANNING', 'FILTERING', 'PROCESSING', 'COMPLETED'];
  const stepper = document.getElementById('stepper');
  const failureBanner = document.getElementById('failure-banner');
  const filesFeed = document.getElementById('files-feed');
  let polling = true;

  function applyPhase(phase) {
    stepper.classList.toggle('failed', phase === 'FAILED');
    const currentIndex = STEP_ORDER.indexOf(phase);
    stepper.querySelectorAll('.step').forEach((el) => {
      el.classList.remove('done', 'active');
      if (phase === 'FAILED') {
        return;
      }
      const idx = STEP_ORDER.indexOf(el.dataset.phase);
      if (idx < currentIndex) {
        el.classList.add('done');
      } else if (idx === currentIndex) {
        el.classList.add('active');
      }
    });
  }

  function setStat(id, value) {
    document.getElementById(id).textContent = value;
  }

  function renderJob(job) {
    applyPhase(job.phase);
    setStat('stat-total', job.totalFiles);
    setStat('stat-processed', job.processedFiles);
    setStat('stat-succeeded', job.succeededFiles);
    setStat('stat-failed', job.failedFiles);
    setStat('stat-skipped', job.skippedFiles);

    if (job.phase === 'FAILED') {
      failureBanner.style.display = 'block';
      failureBanner.textContent = 'Job failed: ' + (job.failureReason || 'unknown error');
    } else {
      failureBanner.style.display = 'none';
    }

    if (job.phase === 'COMPLETED' || job.phase === 'FAILED') {
      polling = false;
    }
  }

  function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
  }

  function formatBytes(bytes) {
    if (bytes < 1024) {
      return bytes + ' B';
    }
    return (bytes / 1024).toFixed(1) + ' KB';
  }

  function renderFiles(files) {
    if (!files.length) {
      filesFeed.innerHTML = '<p class="empty-state">Waiting for output files&hellip;</p>';
      return;
    }
    const rows = files.map((f) => (
      '<tr><td class="mono">' + escapeHtml(f.relativePath) + '</td>'
      + '<td>' + formatBytes(f.sizeBytes) + '</td>'
      + '<td class="mono">' + new Date(f.modifiedAt).toLocaleTimeString() + '</td></tr>'
    )).join('');
    filesFeed.innerHTML = '<table><thead><tr><th>File</th><th>Size</th><th>Updated</th></tr></thead><tbody>'
      + rows + '</tbody></table>';
  }

  async function refresh() {
    try {
      const [jobRes, filesRes] = await Promise.all([
        fetch('/api/v1/extraction-jobs/' + jobId),
        fetch('/api/v1/extraction-jobs/' + jobId + '/output-files'),
      ]);
      if (jobRes.ok) {
        renderJob(await jobRes.json());
      }
      if (filesRes.ok) {
        renderFiles(await filesRes.json());
      }
    } catch (e) {
      console.error('Failed to refresh job status', e);
    }
    if (polling) {
      setTimeout(refresh, 2000);
    }
  }

  refresh();
})();
