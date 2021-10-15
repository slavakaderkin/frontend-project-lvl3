import axios from 'axios';
import i18next from 'i18next';
import * as _ from 'lodash';
import * as yup from 'yup';

import parse from './parser.js';
import initView from './view.js';
import resources from './locales';

const proxy = 'https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=';
const updateTime = 5000;

const validate = (value, feedLinks) => {
  const schema = yup
    .string()
    .required(i18next.t('errors.empty'))
    .notOneOf(feedLinks, i18next.t('errors.uniqueness'))
    .url(i18next.t('errors.url'))
    .matches(/.+\.rss$/, { message: i18next.t('errors.rss'), excludeEmptyString: false });

  try {
    schema.validateSync(value);
    return null;
  } catch (err) {
    return err.message;
  }
};

const setPreviewButttonHandlers = (posts, elements, state) => {
  const postIds = posts.map(({ id }) => id);
  postIds.forEach((id) => elements.posts.querySelector(`[data-id="${id}"]`)
    .addEventListener('click', () => {
      state.read.push(id);
    }));
};

const postsUpdate = (state, elements) => {
  const acc = [];

  state.channels.forEach(({ url, id }) => {
    axios.get(`${proxy}${url}`)
      .then((response) => {
        const { items } = parse(response);
        items.forEach((item) => ({ ...item, channelId: id }));
        acc.push(items);
      });
  });

  const newPosts = acc
    .filter(({ link: newLink }) => state.items.every(({ link }) => newLink !== link));

  if (newPosts.length > 0) {
    const postWithId = newPosts.map((item) => ({ ...item, id: _.uniqueId() }));
    state.items.push(...postWithId);
    setPreviewButttonHandlers(postWithId, elements, state);
  }
  setTimeout(() => postsUpdate(state), updateTime);
};

export default async () => {
  await i18next.init({
    lng: 'ru',
    debug: true,
    resources,
  });

  const state = {
    form: {
      status: 'filling', // loading, failed
      fields: {
        url: {
          valid: true,
          error: null,
        },
      },
    },
    feedback: null,
    channels: [],
    items: [],
    lng: 'ru',
    read: [],
  };

  const form = document.querySelector('.rss-form');

  const elements = {
    h1: document.querySelector('h1'),
    lead: document.querySelector('.lead'),
    example: document.querySelector('p.text-muted'),
    form,
    input: form.querySelector('input'),
    button: form.querySelector('button'),
    feedback: document.querySelector('.feedback'),
    feeds: document.querySelector('div.feeds'),
    posts: document.querySelector('div.posts'),
    toggle: document.querySelector('[data-toggle="language"]'),
    modal: document.querySelector('#previewModal'),
  };

  const watched = initView(state, elements);

  const lngButtons = elements.toggle.querySelectorAll('input');
  lngButtons.forEach((input) => input.addEventListener('click', (e) => {
    const lng = e.target.id;
    watched.lng = lng;
  }));

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const url = formData.get('url');
    const error = validate(url, _.map(watched.channels, 'url'));

    if (error) {
      watched.form.fields.url = {
        valid: false,
        error,
      };
      watched.form.status = 'failed';
      return;
    }

    watched.form.fields.url = {
      valid: true,
      error: null,
    };
    watched.form.status = 'loading';

    axios.get(`${proxy}${url}`)
      .then((response) => {
        const { channel, items } = parse(response);
        channel.id = _.uniqueId('channel_');

        const postsWithId = items
          .map((item) => ({
            ...item,
            id: _.uniqueId(),
            channelId: channel.id,
          }));

        watched.feedback = 'success';
        watched.channels.push(channel);
        watched.items.push(...postsWithId);
        watched.form.status = 'filling';
        setTimeout(() => postsUpdate(watched, elements), updateTime);
        setPreviewButttonHandlers(postsWithId, elements, watched);
      })
      .catch(() => {
        watched.form.status = 'failed';
        watched.feedback = 'failure';
      });
  });
};
