# domeneshop-dynamicdns

<!-- ABOUT THE PROJECT -->
## About The Project

Simple node app for dynamically updating the DNS every x minutes @ domeneshop.

### Built With

* node.js
* domeneshop.js

<!-- GETTING STARTED -->
## Getting Started

To get a local copy up and running follow these simple steps.

### Prerequisites

This is an example of how to list things you need to use the software and how to install them.
* npm
  ```sh
  npm install npm@latest -g
  ```

### Installation

1. Clone the repo
   ```sh
   git clone git@github.com:jvik/domeneshop-dynamicdns.git
   ```
2. Install NPM packages
   ```sh
   npm install
   ```



<!-- USAGE EXAMPLES -->
## Usage

I recommend running the process with docker-compose to keep it alive in the background. You can also use pm2 or similar process managers.

```shell
$ docker build -t domeneshop-dynamicdns
```

```shell
$ docker-compose up
```

## Environment variables
Adjust the environment variables to you needs inside the docker-compose file.
```
TOKEN=your-domeneshop-token
SECRET=your-domeneshop-secret
TTL=600
RECORD=www
DOMAIN=vg.no
CHECK_MINUTES=30
```

<!-- LICENSE -->
## License

Distributed under the WTFPL License. See `LICENSE` for more information.
