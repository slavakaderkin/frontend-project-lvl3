export default (response) => {
  try {
    const parser = new DOMParser();
    const data = response.data.contents || response.data;
    const xml = parser.parseFromString(data, 'text/xml');

    const channel = {
      title: xml.querySelector('channel>title').textContent,
      description: xml.querySelector('channel>description').textContent,
    };

    const items = [...xml.querySelectorAll('item')].map((node) => (
      {
        title: node.querySelector('title').textContent,
        description: node.querySelector('description').textContent,
        link: node.querySelector('link').textContent,
        pubDate: node.querySelector('pubDate').textContent,
      }
    ));

    return {
      channel,
      items,
    };
  } catch (err) {
    throw new Error('parseError');
  }
};
