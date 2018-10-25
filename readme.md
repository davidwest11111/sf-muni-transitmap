# Real-Time Transit Map (SF Muni)
A transit map showing (almost) real-time transit data obtained from the [NextBus XML Feed](https://www.nextbus.com/xmlFeedDocs/NextBusXMLFeed.pdf). The bus locations update once every 15 seconds. Select one or more routes to see the bus locations.

![Screenshot](./screenshot.png)

### Run locally
While it is possible to host this map on a server, but the site needs to
be served over `http://` and not `https://` as the NextBus API uses
`http://`.

To run this code locally, you'll need to start a local server at the directory containing index.html, since the js file accesses some local data files (from the data/ folder).
