# ![navitia playground](https://rawgithub.com/CanalTP/navitia-playground/master/img/n_playground.svg) [![Build status](https://travis-ci.org/CanalTP/navitia-playground.svg?branch=master)](https://travis-ci.org/CanalTP/navitia-playground)

Web UI for the [navitia](https://github.com/CanalTP/navitia) API. You can get a token [here](http://www.navitia.io) and then use this UI [here](http://canaltp.github.io/navitia-playground/).

## Screenshots

![Request](screenshots/request.png) ![Response](screenshots/response.png)

## Setting your dev environment to contribute

### Requirements
- node v8.x LTS ([nvm](https://github.com/creationix/nvm) is recommanded for installing node)

### Installation
```bash
npm install && npx bower install
```

### Launch the application
```bash
npx gulp dev
```

## License

This project is under the [MIT license](LICENSE). See the [bower file](bower.json) for the running dependencies and the [npm file](package.json) for dev dependencies.
