/* eslint-disable no-param-reassign */
import i18next from 'i18next';
import onChange from 'on-change';

const renderContent = (elements) => {
  elements.button.textContent = i18next.t('button.default');
  elements.input.placeholder = i18next.t('placeholder');
  elements.h1.textContent = i18next.t('h1');
  elements.lead.textContent = i18next.t('lead');
  elements.example.textContent = i18next.t('example');
  elements.modal.querySelector('button.close-btn').textContent = i18next.t('modal.closeButton');
  elements.modal.querySelector('a.read-more').textContent = i18next.t('modal.readMore');
  if (elements.feeds.querySelector('h2')) {
    elements.feeds.querySelector('h2').textContent = i18next.t('feeds');
  }
  if (elements.posts.querySelector('h2')) {
    elements.posts.querySelector('h2').textContent = i18next.t('posts');
  }
  document.querySelectorAll('[data-target="#previewModal"]').forEach((btn) => {
    btn.textContent = i18next.t('previewButton');
  });
};

const changeLanguage = (lng, elements) => {
  elements.toggle.querySelectorAll('.btn').forEach((el) => el.classList.toggle('active'));
  i18next.changeLanguage(lng, () => renderContent(elements));
};

const renderFormErrors = (field, { input, feedback }) => {
  if (field.valid) {
    input.classList.remove('is-invalid');
    feedback.className = 'feedback';
    feedback.textContent = '';
  } else {
    input.classList.add('is-invalid');
    feedback.className = 'text-danger feedback';
    feedback.textContent = field.error;
  }
};

const renderFeedback = (value, { feedback }) => {
  switch (value) {
    case 'success':
      feedback.innerHTML = `${i18next.t('success')}`;
      feedback.className = 'text-success feedback';
      break;
    case 'failure':
      feedback.innerHTML = `${i18next.t('errors.network')}`;
      feedback.className = 'text-danger feedback';
      break;
    default:
      feedback.innerHTML = '';
      feedback.className = 'feedback';
  }
};

const renderForm = (value, { input, button }) => {
  switch (value) {
    case 'filling':
      input.value = '';
      input.removeAttribute('disabled');
      input.removeAttribute('readonly');
      button.removeAttribute('disabled');
      input.select();
      button.innerHTML = i18next.t('button.default');
      break;
    case 'failed':
      input.removeAttribute('disabled');
      input.emoveAttribute('readonly');
      button.removeAttribute('disabled');
      input.select();
      button.innerHTML = i18next.t('button.default');
      break;
    case 'loading':
      input.setAttribute('disabled', true);
      input.setAttribute('readonly', true);
      button.setAttribute('disabled', true);
      button.innerHTML = `<span class="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span>${i18next.t('button.loading')}`;
      break;
    default:
      throw new Error(`Unknown form status: ${value}`);
  }
};

const renderChannels = (channels, { feeds }) => {
  feeds.innerHTML = '';
  const h2 = document.createElement('h2');
  h2.innerHTML = i18next.t('feeds');
  feeds.append(h2);

  const channelElements = channels.reverse()
    .map((channel) => {
      const div = document.createElement('div');
      const h4 = document.createElement('h4');
      const p = document.createElement('p');
      div.setAttribute('id', channel.id);
      div.classList.add('mt-4', 'p-4', 'border', 'rounded-sm');
      h4.textContent = channel.title;
      p.textContent = channel.description;
      div.append(h4, p);
      return div;
    });

  feeds.append(...channelElements);
};

const createPreviewButton = (post, modal) => {
  const button = document.createElement('button');
  button.setAttribute('type', 'button');
  button.classList.add('btn', 'btn-primary', 'btn-sm');
  button.dataset.id = post.id;
  button.dataset.toggle = 'modal';
  button.dataset.target = '#previewModal';
  button.textContent = i18next.t('previewButton');

  button.addEventListener('click', () => {
    modal.querySelector('.modal-title').textContent = post.title;
    modal.querySelector('.modal-body').textContent = post.description;
    modal.querySelector('a.read-more').setAttribute('href', post.link);
    modal.querySelector('a.read-more').setAttribute('target', '_blanck');
  });

  return button;
};

const markAsRead = (read) => {
  const id = read[read.length - 1];
  const title = document.getElementById(id);
  title.classList.remove('font-weight-bold');
  title.classList.add('font-weight-normal');
};

const renderItems = (items, { posts, modal }) => {
  posts.innerHTML = '';
  const h2 = document.createElement('h2');
  h2.innerHTML = i18next.t('posts');
  posts.append(h2);

  const postsList = items.map((item) => {
    const div = document.createElement('div');
    div.classList.add('p-3', 'mt-4', 'border', 'rounded-sm', 'justify-content-between', 'd-flex');
    const a = document.createElement('a');
    a.classList.add('font-weight-bold');
    a.setAttribute('href', item.link);
    a.setAttribute('id', item.id);
    a.setAttribute('target', '_blanck');
    a.textContent = item.title;
    const previewButton = createPreviewButton(item, modal);
    div.append(a);
    div.append(previewButton);
    return div;
  });
  posts.append(...postsList);
};

export default (state, elements) => {
  renderContent(elements);

  const mapping = {
    'form.fields.url': (url) => renderFormErrors(url, elements),
    'form.status': (value) => renderForm(value, elements),
    channels: (value) => renderChannels(value, elements),
    items: (value) => renderItems(value, elements),
    lng: (value) => changeLanguage(value, elements),
    read: (value) => markAsRead(value),
    feedback: (value) => renderFeedback(value, elements),
  };

  const watchedState = onChange(state, (path, value) => {
    console.log(path, value);
    if (mapping[path]) {
      mapping[path](value);
    }
  });

  return watchedState;
};
