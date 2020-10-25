/* eslint-disable no-param-reassign */
import onChange from 'on-change';

const renderFormErrors = (field, { input, feedback }) => {
  if (field.valid) {
    input.classList.remove('is-invalid');
    feedback.textContent = '';
  } else {
    input.classList.add('is-invalid');
    feedback.textContent = field.error;
  }
};

const renderForm = (value, { input, button }) => {
  switch (value) {
    case 'filling':
      input.value = '';
      input.removeAttribute('disabled');
      button.removeAttribute('disabled');
      input.select();
      button.innerHTML = 'Add';
      break;
    case 'failed':
      input.removeAttribute('disabled');
      button.removeAttribute('disabled');
      input.select();
      button.innerHTML = 'Add';
      break;
    case 'loading':
      input.setAttribute('disabled', true);
      button.setAttribute('disabled', true);
      button.innerHTML = `<span class="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span>
        Loading...`;
      break;
    default:
      throw new Error(`Unknown form status: ${value}`);
  }
};

const renderChannels = (channels, { feeds }) => {
  feeds.innerHTML = '';
  const channelElements = channels.reverse()
    .map((channel) => {
      const div = document.createElement('div');
      const h2 = document.createElement('h2');
      const p = document.createElement('p');
      div.setAttribute('id', channel.id);
      div.classList.add('mt-4', 'p-4', 'border', 'rounded-sm');
      h2.textContent = channel.title;
      p.textContent = channel.description;
      div.append(h2, p);
      return div;
    });

  feeds.append(...channelElements);
};

const renderItems = (items, { feeds }) => {
  items.forEach((item) => {
    const channel = feeds.querySelector(`#${item.channelId}`);
    const div = document.createElement('div');
    const a = document.createElement('a');
    a.setAttribute('href', item.link);
    a.textContent = item.title;
    div.append(a);
    channel.append(div);
  });
};

export default (state, elements) => {
  const mapping = {
    'form.fields.url': (url) => renderFormErrors(url, elements),
    'form.status': (value) => renderForm(value, elements),
    channels: (value) => renderChannels(value, elements),
    items: (value) => renderItems(value, elements),
  };

  const watchedState = onChange(state, (path, value) => {
    console.log(path, value);
    if (mapping[path]) {
      mapping[path](value);
    }
  });

  return watchedState;
};
