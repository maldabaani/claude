(function () {
  const jobId = document.body.dataset.jobId;
  const log = document.getElementById('chat-log');
  const form = document.getElementById('ask-form');
  const input = document.getElementById('question-input');

  function appendBubble(role, text, sources) {
    const bubble = document.createElement('div');
    bubble.className = 'bubble bubble-' + role;
    bubble.textContent = text;
    if (sources && sources.length) {
      const sourcesEl = document.createElement('div');
      sourcesEl.className = 'sources';
      sources.forEach((source) => {
        const chip = document.createElement('span');
        chip.className = 'source-chip';
        chip.textContent = source;
        sourcesEl.appendChild(chip);
      });
      bubble.appendChild(sourcesEl);
    }
    log.appendChild(bubble);
    log.scrollTop = log.scrollHeight;
    return bubble;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const question = input.value.trim();
    if (!question) {
      return;
    }
    appendBubble('user', question);
    input.value = '';
    input.disabled = true;

    const pending = appendBubble('assistant', 'Thinking…');
    pending.classList.add('pending');

    try {
      const response = await fetch('/api/v1/extraction-jobs/' + jobId + '/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = await response.json();
      pending.remove();
      if (response.ok) {
        appendBubble('assistant', data.answer, data.sourceFiles);
      } else {
        appendBubble('assistant', 'Error: ' + (data.message || response.statusText));
      }
    } catch (e) {
      pending.remove();
      appendBubble('assistant', 'Network error: ' + e.message);
    } finally {
      input.disabled = false;
      input.focus();
    }
  });
})();
