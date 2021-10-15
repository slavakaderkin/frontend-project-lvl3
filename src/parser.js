export default (response) => {
  const parser = new DOMParser();
  const xml = parser.parseFromString(response.data.contents, 'text/xml');

  const channel = {
    title: xml.querySelector('channel>title').textContent,
    description: xml.querySelector('channel>description').textContent,
    url: response.data.status.url,
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
};
