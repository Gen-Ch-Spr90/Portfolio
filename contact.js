(function () {
  var copyBtn = document.getElementById('copy-email-btn');
  var feedback = document.getElementById('copy-feedback');

  if (!copyBtn || !feedback) {
    return;
  }

  copyBtn.addEventListener('click', function () {
    var email = copyBtn.getAttribute('data-email') || '';
    if (!email) {
      feedback.textContent = 'Email is unavailable right now.';
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
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

    var tempInput = document.createElement('input');
    tempInput.value = email;
    document.body.appendChild(tempInput);
    tempInput.select();

    try {
      document.execCommand('copy');
      feedback.textContent = 'Email copied: ' + email;
    } catch (err) {
      feedback.textContent = 'Copy failed. Please copy manually: ' + email;
    }

    document.body.removeChild(tempInput);
  });
})();
