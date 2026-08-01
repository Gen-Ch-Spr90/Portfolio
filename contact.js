(function () {
  const form = document.querySelector('.contact-form');
  const submitBtn = form ? form.querySelector('.contact-submit') : null;
  const formFeedback = document.getElementById('form-feedback');
  const copyBtn = document.getElementById('copy-email-btn');
  const feedback = document.getElementById('copy-feedback');

  function setFormFeedback(message, tone) {
    if (!formFeedback) {
      return;
    }

    formFeedback.textContent = message;
    formFeedback.classList.remove('is-success', 'is-error', 'is-pending');
    if (tone) {
      formFeedback.classList.add(tone);
    }
  }

  function readText(formData, key) {
    const value = formData.get(key);
    return typeof value === 'string' ? value.trim() : '';
  }

  if (form && submitBtn) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();

      const endpoint = form.dataset.endpoint || form.getAttribute('action') || '/api/contact';
      const successUrl = form.dataset.successUrl || 'success.html';
      const formData = new FormData(form);

      // Treat filled honeypot as a successful submit to avoid bot probing.
      const honeyValue = readText(formData, '_honey');
      if (honeyValue) {
        window.location.href = successUrl;
        return;
      }

      const payload = {
        name: readText(formData, 'name'),
        last_name: readText(formData, 'last_name'),
        email: readText(formData, 'email'),
        phone: readText(formData, 'phone'),
        message: readText(formData, 'message'),
        subject: readText(formData, '_subject'),
        _honey: honeyValue,
      };

      if (!payload.name || !payload.last_name || !payload.email || !payload.message) {
        setFormFeedback('Please fill in all required fields before sending.', 'is-error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
      setFormFeedback('Sending your message...', 'is-pending');

      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      })
        .then(function (response) {
          if (!response.ok) {
            return response.json().catch(function () {
              return { error: 'Unable to send message right now.' };
            }).then(function (data) {
              throw new Error(data.error || 'Unable to send message right now.');
            });
          }

          return response.json().catch(function () {
            return { success: true };
          });
        })
        .then(function () {
          setFormFeedback('Message sent. Redirecting...', 'is-success');
          form.reset();
          window.location.href = successUrl;
        })
        .catch(function (error) {
          setFormFeedback(error.message || 'Unable to send message right now. Please try again.', 'is-error');
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Message';
        });
    });
  }

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
