(() => {
  if (document.body?.dataset.workspaceSection !== 'connect') return;
  const container = document.querySelector('[data-connect-people-root]') || document.querySelector('.k-app-container');
  if (!container) return;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const path = (value) => encodeURIComponent(String(value || ''));
  const api = async (url, options = {}) => {
    const response = await fetch(url, { credentials: 'same-origin', ...options });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.success === false) throw new Error(payload?.error || `Request failed (${response.status})`);
    return payload;
  };
  const followState = async (personPhone) => {
    try { const result = await api(`/api/relationships/person/${path(personPhone)}?relationshipType=follow`); return result.relationship?.status === 'active'; }
    catch { return false; }
  };
  const follow = async (personPhone, active) => {
    if (active) return api(`/api/relationships/person/${path(personPhone)}?relationshipType=follow`, { method: 'DELETE' });
    return api('/api/relationships', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetType: 'person', targetId: personPhone, relationshipType: 'follow', visibility: 'private' }) });
  };
  const communicationAction = (person) => {
    const message = person.communication?.message ? '<button class="workspace-text-action" type="button" data-k57-message>Message</button>' : '<span class="k57-contact-meta">Messaging is not authorized for this relationship.</span>';
    const call = person.communication?.call
      ? '<span class="k57-contact-meta">Call transport is ready after a secure call session is arranged in Messages.</span>'
      : `<span class="k57-contact-meta">${esc(person.communication?.callUnavailableReason || 'Calling is unavailable right now.')}</span>`;
    return `${message}${call}`;
  };
  const openMessageComposer = (card, person) => {
    const existing = card.querySelector('[data-k57-message-compose]');
    if (existing) { existing.querySelector('textarea')?.focus(); return; }
    const form = document.createElement('form'); form.className = 'k57-contact-compose'; form.dataset.k57MessageCompose = '1';
    const label = document.createElement('label'); label.textContent = `Message ${person.displayName}`;
    const body = document.createElement('textarea'); body.name = 'message'; body.required = true; body.maxLength = 4000; body.rows = 3; body.placeholder = 'Write the message you want Kurukoo to prepare…'; body.setAttribute('aria-label', `Message for ${person.displayName}`);
    const note = document.createElement('p'); note.className = 'k57-contact-meta'; note.textContent = 'Kurukoo will prepare this in Chat. It is not sent until an authorised channel is available and you confirm.';
    const controls = document.createElement('div'); controls.className = 'k57-contact-actions';
    const submit = document.createElement('button'); submit.className = 'workspace-text-action'; submit.type = 'submit'; submit.textContent = 'Prepare in Chat';
    const cancel = document.createElement('button'); cancel.className = 'workspace-text-action'; cancel.type = 'button'; cancel.textContent = 'Cancel'; cancel.addEventListener('click', () => form.remove());
    const status = document.createElement('span'); status.className = 'k57-contact-meta'; status.setAttribute('role', 'status');
    controls.append(submit, cancel); form.append(label, body, note, controls, status);
    form.addEventListener('submit', (event) => {
      event.preventDefault(); const message = body.value.trim();
      if (!message) { status.textContent = 'Write a message before continuing.'; body.focus(); return; }
      try { sessionStorage.setItem('kurukoo_contact_message_draft', JSON.stringify({ contactId: String(person.identityId), body: message.slice(0, 4000), createdAt: Date.now() })); }
      catch { status.textContent = 'Kurukoo could not keep this private draft in this browser. Try Chat directly.'; return; }
      const target = new URL('/chat', window.location.origin); target.searchParams.set('contactCompose', '1');
      const conversationId = localStorage.getItem('kurukoo_conversation_id'); if (conversationId) target.searchParams.set('conversationId', conversationId.slice(0, 160));
      window.location.assign(`${target.pathname}${target.search}`);
    });
    card.insertBefore(form, card.querySelector('.k57-contact-actions'));
    body.focus();
  };
  const render = async (contacts) => {
    const section = document.createElement('section'); section.className = 'k57-contacts'; section.setAttribute('aria-labelledby', 'k57-contacts-title');
    section.innerHTML = `<div class="k-app-card"><span class="k-app-card-label">People & relationships</span><h2 id="k57-contacts-title">Your contacts</h2><p>Keep the people you know in one place. Messaging and calling are available when the related service is ready.</p><form class="k57-contact-add" data-k57-add><label>Contact phone or identity<input name="personPhone" autocomplete="tel" inputmode="tel" required placeholder="Enter a known Kurukoo contact"></label><button class="k-app-primary" type="submit">Add contact</button></form><div class="k57-contact-state" data-k57-add-state></div></div><section class="k-app-card"><div class="k57-contact-grid" data-k57-list></div><div class="k57-unavailable" data-k57-empty hidden><div><h3>No contacts yet</h3><p>Add a known Kurukoo contact. People are only shown when you add or connect them.</p></div></div></section></section>`;
    const list = section.querySelector('[data-k57-list]');
    const contactRows = await Promise.all(contacts.map(async (person) => ({ person, activeFollow: await followState(person.identityId) })));
    contactRows.forEach(({ person, activeFollow }) => {
      const card = document.createElement('article'); card.className = 'k57-contact-card';
      const avatar = person.avatar || { initials: '?' };
      card.innerHTML = `<div class="k57-contact-head"><div class="k57-avatar" aria-hidden="true">${esc(avatar.initials)}</div><div><h3>${esc(person.displayName)}</h3><div class="k57-contact-meta"><span>${esc(String(person.participantKind || 'human'))}</span><span>${esc(String(person.presence || 'unknown'))}</span>${person.provider ? `<span>${person.provider.verified ? 'Verified provider' : 'Provider'}${person.provider.available ? ' · available' : ''}</span>` : ''}</div></div></div><div class="k57-contact-meta"><span>Relationship: ${esc(person.relationship?.status || 'none')}</span>${person.relationship?.safetyContact ? '<span>Safety contact</span>' : ''}</div><div class="k57-contact-actions">${communicationAction(person)}<button class="workspace-text-action" type="button" data-k57-follow>${activeFollow ? 'Unfollow' : 'Follow'}</button><button class="workspace-text-action" type="button" data-k57-remove>Remove contact</button></div>`;
      const messageButton = card.querySelector('[data-k57-message]');
      messageButton?.addEventListener('click', () => openMessageComposer(card, person));
      const followButton = card.querySelector('[data-k57-follow]');
      followButton.addEventListener('click', async () => { followButton.disabled = true; try { await follow(person.identityId, activeFollow); await load(); } catch (error) { followButton.disabled = false; followButton.textContent = error instanceof Error ? error.message : 'Could not update'; } });
      card.querySelector('[data-k57-remove]').addEventListener('click', async (event) => { const button = event.currentTarget; button.disabled = true; try { await api(`/api/contacts/${path(person.identityId)}`, { method: 'DELETE' }); await load(); } catch { button.disabled = false; button.textContent = 'Could not remove'; } });
      list.appendChild(card);
    });
    section.querySelector('[data-k57-add]').addEventListener('submit', async (event) => { event.preventDefault(); const form = event.currentTarget; const phone = form.elements.personPhone.value.trim(); const state = section.querySelector('[data-k57-add-state]'); const button = form.querySelector('button'); button.disabled = true; state.textContent = 'Checking contact…'; try { await api('/api/contacts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ personPhone: phone }) }); form.reset(); state.textContent = 'Contact added.'; await load(); } catch (error) { state.textContent = error instanceof Error ? error.message : 'Unable to add contact'; } finally { button.disabled = false; } });
    return section;
  };
  const loading = () => { const section = document.createElement('section'); section.className = 'k57-contacts'; section.innerHTML = '<section class="k-app-card" aria-live="polite" aria-busy="true"><div class="k-app-list-loading">Loading your contacts…</div></section>'; return section; };
  const load = async () => {
    const prior = container.querySelector('.k57-contacts'); prior?.remove();
    const place = loading(); container.appendChild(place);
    try { const payload = await api('/api/contacts'); const contacts = Array.isArray(payload.contacts) ? payload.contacts : []; const section = await render(contacts); place.replaceWith(section); section.querySelector('[data-k57-empty]').hidden = contacts.length > 0; }
    catch { const failed = loading(); failed.innerHTML = '<section class="k-app-card k57-unavailable" role="alert"><div><h3>Contacts are unavailable</h3><p>Kurukoo could not load your contacts. No relationship or communication status is shown until it can be confirmed.</p><button class="k-app-primary" type="button" data-k57-retry>Retry Contacts</button></div></section>'; container.appendChild(failed); failed.querySelector('[data-k57-retry]').addEventListener('click', load); }
  };
  load();
})();
