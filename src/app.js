import axios from 'axios';
import * as _ from 'lodash';
import * as yup from 'yup';

import parse from './parser.js';
import initView from './view.js';

const validate = (value, feedLinks) => {
  const schema = yup
    .string()
    .required()
    .notOneOf(feedLinks, 'you are already following this rss')
    .url()
    .matches(/.+\.rss$/, { message: 'error message', excludeEmptyString: false });

  try {
    schema.validateSync(value);
    return null;
  } catch (err) {
    return err.message;
  }
};

export default () => {
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
  };

  const form = document.querySelector('.rss-form');
  const input = form.querySelector('input');
  const button = form.querySelector('button');
  const feedback = document.querySelector('div.invalid-feedback');
  const feeds = document.querySelector('div.feeds');

  const elements = {
    form,
    input,
    button,
    feedback,
    feeds,
  };

  const watched = initView(state, elements);

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const feed = formData.get('url');
    const error = validate(feed, _.map(watched.channels, 'url'));

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

    const proxy = 'https://cors-anywhere.herokuapp.com/';
    axios.get(`${proxy}${feed}`)
      .then((response) => {
        const { channel, items } = parse(response);
        watched.error = null;
        watched.channels.push(channel);
        watched.items.push(...items);
        watched.form.status = 'filling';
      })
      .catch((err) => {
        watched.form.status = 'failed';
        watched.error = err.message;
      });
  });
};
