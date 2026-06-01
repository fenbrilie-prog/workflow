(function () {
  var modal = document.getElementById('demo-modal');
  var formContainer = document.getElementById('hubspot-form-container');
  var formLoaded = false;

  function openModal() {
    modal.classList.add('is-open');
    modal.removeAttribute('hidden');
    document.body.classList.add('demo-modal-open');

    // Lazy-load the HubSpot form on first open
    if (!formLoaded && window.hbspt && window.hbspt.forms) {
      window.hbspt.forms.create({
        region: "na1",
        portalId: "4351004",
        formId: "ad82bdab-9ec9-4e52-9c1e-690b6137f680",
        target: "#hubspot-form-container",
        onFormSubmit: function ($form) {
          try {
            var hsFullName = $form[0].fullName ? $form[0].fullName.value : '';
            var hsEmail = $form[0].email ? $form[0].email.value : '';
            if (window.navattic && typeof window.navattic.identify === 'function') {
              window.navattic.identify({
                'user.fullName': hsFullName,
                'user.email': hsEmail
              });
            }
          } catch (err) {
            console.warn('navattic identify failed', err);
          }
        }
      });
      formLoaded = true;
    }
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('hidden', '');
    document.body.classList.remove('demo-modal-open');
  }

  // Trigger buttons
  document.querySelectorAll('[data-demo-trigger]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      openModal();
    });
  });

  // Close handlers: backdrop, close button, ESC
  document.querySelectorAll('[data-demo-close]').forEach(function (el) {
    el.addEventListener('click', closeModal);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
  });

  // Chili Piper handoff: when HubSpot fires onFormSubmitted, route to scheduling
  var cpTenantDomain = "checkbox";
  var cpRouterName = "inbound-router";
  var cpHubspotFormIDs = ["ad82bdab-9ec9-4e52-9c1e-690b6137f680"];
  var lead = {};

  window.addEventListener("message", function (event) {
    if (cpHubspotFormIDs.length > 0 && !cpHubspotFormIDs.includes(event.data.id)) return;
    if (event.data.type === "hsFormCallback") {
      if (event.data.eventName === "onFormSubmit") {
        for (var key in event.data.data) {
          if (Array.isArray(event.data.data[key].value)) {
            event.data.data[key].value = event.data.data[key].value.toString().replaceAll(",", ";");
          }
          lead[event.data.data[key].name] = event.data.data[key].value;
        }
        if (Object.keys(lead).length <= 1) { lead = event.data.data; }
      } else if (event.data.eventName === "onFormSubmitted") {
        if (window.ChiliPiper && typeof window.ChiliPiper.submit === 'function') {
          window.ChiliPiper.submit(cpTenantDomain, cpRouterName, { map: true, lead: lead });
        }
        if (window.pagenavattic && typeof window.pagenavattic.identify === 'function') {
          window.pagenavattic.identify({ email: lead.email });
        }
      }
    }
  });
})();
