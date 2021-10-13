import axios from 'axios';
import i18next from 'i18next';
import * as _ from 'lodash';
import * as yup from 'yup';

import parse from './parser.js';
import initView from './view.js';
import resources from './locales';

const proxy = 'https://api.allorigins.win/raw?url=';
const updateTime = 5000;

const validate = (value, feedLinks) => {
  const schema = yup
    .string()
    .required()
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

const postsUpdate = (watched) => {
  watched.channels.forEach(({ url, id }) => {
    console.log(`id ${id}, url ${url}`);

    axios.get(`${proxy}${url}`)
      .then((response) => {
        const { items } = parse(response);

        const newPosts = _.xorBy(watched.items, items, 'title');

        if (newPosts.length > 0) {
          // eslint-disable-next-line no-restricted-syntax
          for (const item of newPosts) {
            item.id = _.uniqueId();
            item.channelId = id;
          }
          watched.items.push(...newPosts);
        }
      });

    setTimeout(() => postsUpdate(watched), updateTime);
  });
};

export default async () => {
  await i18next.init({
    lng: 'en',
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
    error: null,
    channels: [],
    items: [],
    lng: 'en',
  };

  const form = document.querySelector('.rss-form');
  const elements = {
    h1: document.querySelector('h1'),
    lead: document.querySelector('.lead'),
    example: document.querySelector('p.text-muted'),
    form,
    input: form.querySelector('input'),
    button: form.querySelector('button'),
    feedback: document.querySelector('div.invalid-feedback'),
    feeds: document.querySelector('div.feeds'),
    posts: document.querySelector('div.posts'),
    toggle: document.querySelector('[data-toggle="language"]'),
  };

  const watched = initView(state, elements);

  const inputs = elements.toggle.querySelectorAll('input');
  inputs.forEach((input) => input.addEventListener('click', (e) => {
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

        // eslint-disable-next-line no-restricted-syntax
        for (const item of items) {
          item.id = _.uniqueId();
          item.channelId = channel.id;
        }

        watched.error = null;
        watched.channels.push(channel);
        watched.items.push(...items);
        watched.form.status = 'filling';
        setTimeout(() => postsUpdate(watched), updateTime);
      })
      .catch((err) => {
        watched.form.status = 'failed';
        watched.error = err.message;
      });
  });
};
