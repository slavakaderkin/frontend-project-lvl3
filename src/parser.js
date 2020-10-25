import _ from 'lodash';

export default (response) => {
  const parser = new DOMParser();
  const xml = parser.parseFromString(response.data, 'text/xml');

  const channel = {
    title: xml.querySelector('channel>title').textContent,
    description: xml.querySelector('channel>description').textContent,
    url: response.headers['x-final-url'],
    id: _.uniqueId('channel_'),
  };

  const items = [...xml.querySelectorAll('item')].map((node) => (
    {
      title: node.querySelector('title').textContent,
      description: node.querySelector('description').textContent,
      link: node.querySelector('link').textContent,
      pubDate: node.querySelector('pubDate').textContent,
      id: _.uniqueId(),
      channelId: channel.id,
    }
  ));

  return {
    channel,
    items,
  };
};
