(() => {
  const form = document.getElementById('ads-form');
  const tableBody = document.getElementById('ads-tbody');
  const status = document.getElementById('ads-status');
  const refresh = document.getElementById('ads-refresh');

  const fields = ['title', 'desc', 'imageUrl', 'targetKeyword', 'creditsBudget', 'disclosure', 'advertiserName', 'ctaText', 'destination', 'placement', 'category', 'country', 'region', 'targeting'];

  const setStatus = (message, tone = '') => {
    status.textContent = message;
    status.className = `admin-status ${tone}`.trim();
  };

  const cell = (value) => {
    const td = document.createElement('td');
    td.textContent = value == null || value === '' ? '—' : String(value);
    return td;
  };

  const renderCampaigns = (campaigns) => {
    tableBody.replaceChildren();
    if (!Array.isArray(campaigns) || campaigns.length === 0) {
      const row = document.createElement('tr');
      const empty = document.createElement('td');
      empty.colSpan = 7;
      empty.textContent = 'No campaigns found.';
      row.appendChild(empty);
      tableBody.appendChild(row);
      return;
    }
    campaigns.forEach((campaign) => {
      const row = document.createElement('tr');
      row.append(
        cell(campaign.title),
        cell(campaign.advertiserName || campaign.advertiser_name || 'Kurukoo'),
        cell(campaign.placement),
        cell(campaign.status),
        cell(campaign.assetStatus || campaign.asset_status),
        cell(campaign.disclosure),
        cell(campaign.destination)
      );
      tableBody.appendChild(row);
    });
  };

  const loadCampaigns = async () => {
    setStatus('Loading campaigns…');
    try {
      const response = await fetch('/api/admin/ads', { credentials: 'same-origin' });
      if (!response.ok) throw new Error(`Request failed (${response.status})`);
      renderCampaigns(await response.json());
      setStatus('Campaigns loaded.', 'is-success');
    } catch (error) {
      renderCampaigns([]);
      setStatus(`Unable to load campaigns: ${error.message}`, 'is-error');
    }
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(fields.map((field) => [field, document.getElementById(`ad-${field}`).value.trim()]));
    payload.creditsBudget = Number(payload.creditsBudget);
    setStatus('Creating campaign…');
    try {
      const response = await fetch('/api/admin/ads', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);
      form.reset();
      setStatus('Campaign created. It remains subject to approval, asset validation, timing, and readiness rules.', 'is-success');
      await loadCampaigns();
    } catch (error) {
      setStatus(`Campaign was not created: ${error.message}`, 'is-error');
    }
  });

  refresh.addEventListener('click', loadCampaigns);
  loadCampaigns();
})();
