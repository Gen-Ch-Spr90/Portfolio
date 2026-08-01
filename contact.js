(function () {
  const copyBtn = document.getElementById('copy-email-btn');
  const feedback = document.getElementById('copy-feedback');

  if (!copyBtn || !feedback) {
    return;
  }

  copyBtn.addEventListener('click', function () {
    const emailUser = copyBtn.dataset.emailUser || '';
    const emailDomain = copyBtn.dataset.emailDomain || '';
    const email = emailUser && emailDomain ? emailUser + '@' + emailDomain : '';
    if (!email) {
      feedback.textContent = 'Email is unavailable right now.';
      return;
    }

    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(email)
        .then(function () {
          feedback.textContent = 'Email copied: ' + email;
        })
        .catch(function () {
          feedback.textContent = 'Copy failed. Please copy manually: ' + email;
        });
      return;
    }

    feedback.textContent = 'Copy not supported here. Please copy manually: ' + email;
  });
})();
