Ubuntu Web Application Packager
===============================

This node module allows a developer to easily package a web application to run on the Ubuntu Touch platform. It is usable directly from the command line, or directly when
imported (through Gulp for example).

# CLI

When using the Command Line Interface, a configuration file (written in JSON) must be provided. The correct syntax is the following:

packager -s *source directory* -d *destination directory* *configuration file*

The configuration file is mandatory and must be provided. It must be a correct JSON file following the format described below. The source directory and destination directory should
be provided if the properties are absent from the configuration file. If they are specified in both the configuration and as an argument, the argument value will be used.

# Configuration File

## Properties

The configuration file is a simple JSON file with the following properties:

- *src* : Source directory that contains the web application files to be packaged
- *dest* : Destination directory where the generated click package will be saved
- *main_html* : HTML file that needs to be loaded by default when starting the web application (default: index.html)
- *manifest* : Object that contains information about the application:
  - *description*: A description of the application, default: Default description for web app
  - *maintainer*: The maintainer name, default: Ubuntu Developer
  - *maintainer_email*: The maintainer email, default: ubuntu@developer.com
  - *id*: The application unique identifier, default: com.example.com.untitled
  - *title*: The application title, default: Untitled
  - *version*: The version of the application
  - *framework*: The Ubuntu framework to be used, default: ubuntu-sdk-14.10-dev2
- *apparmor*: Object that contains information about the security of the application.
  - *policy_version*: Version of the policy to be used, default: 1.3
  - *policy_groups*: Policy groups used by the application, default: ["networking"]
- *inspector*: Boolean specifying whether or not the web inspector should be enabled when running the web application on the device.
- *validate*: Boolean specifying whether the generated click package should be validated.
- *install*: Boolean specifying whether the generated click package should be deployed and installed on the connected device.

## Example

```json
{
  "src": "dist",
  "manifest": {
    "description": "Ubuntu Touch Podcast Application",
    "maintainer": "Jean-Francois Moy",
    "maintainer_email": "jeanfrancois.moy@canonical.com",
    "title": "Example Application",
    "id": "com.canonical.example"
  },
  "install": true,
  "apparmor": {
    "policy_version": "1.2"
  }
}
```

# Using with Node.js

It is pretty straightforward to use the packager within one of your node module. Simply import the module and call it providing a javascript object containing the configuration as defined above.

```javascript
var packager = require('ubuntu-webapp-packager');
packager({
  src: "dist",
  dest: "build",
  main_html: "index.html",
  manifest: {
    title: "Example Application"
  }
});
```
