var Service, Characteristic;

var sys = require('sys')
var exec = require('child_process').exec;

var Jimp = require('jimp');

var convert = require('color-convert');

module.exports = function(homebridge) {
  console.log("homebridge API version: " + homebridge.version);

  // Service and Characteristic are from hap-nodejs
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
 
  // For platform plugin to be considered as dynamic platform plugin,
  // registerPlatform(pluginName, platformName, constructor, dynamic), dynamic must be true
  homebridge.registerAccessory("homebridge-image-brightness-sensor", "ImageBrightnessSensor", ImageBrightnessSensorAccessory);
}

function ImageBrightnessSensorAccessory(log, config) {
  this.log = log;

  this.name = config["name"]
  this.image_source = config["imageSource"]
  this.updateInterval = config["updateInterval"]
  this.width = config["width"]
  this.height = config["height"]
}

//function puts(error, stdout, stderr) { sys.puts(stdout) }

ImageBrightnessSensorAccessory.prototype = {
  
  puts: function(error, stdout, stderr) { 

  },

  updateState: function () {
    // CODE TO CHECK IF MAC ADDRESS IS ON NETWORK
    
    var self = this
    
    Jimp.read(this.image_source)
        .then(image => {
            var totalValue = 0;
            var top_50 = 0;
            var lux = 0;
            var lux_array = [];
            image.resize(self.width, self.height);
            
            for(var i = 0; i < self.width; i++) {
                for(var j = 0; j < self.height; j++) {
                    rgba_dict = Jimp.intToRGBA(image.getPixelColor(i, j));
                    
                    //hsv = rgb2hsv(rgba_dict.r, rgba_dict.g, rgba_dict.b);
                    
                    //totalValue = totalValue + (0.2126 * rgba_dict.r + 0.7152 * rgba_dict.g +             0.0722 * rgba_dict.b)
                    
                    xyz = convert.rgb.xyz(rgba_dict.r, rgba_dict.g, rgba_dict.b);
                    
                    totalValue = totalValue + xyz[1]
                    
                    lux_array.push(xyz[1])
                }
            }
            
            lux_array.sort((a, b) => b - a)
            
            var num_points = (self.width * self.height) / 2;
            for(var i = 0; i < num_points; i++) {
                top_50 = top_50 + lux_array[i];
            }

            lux = (top_50 / (num_points / 1000));
            
            //rgb = rgba2rgb(rgba_dict.r, rgba_dict.g, rgba_dict.b, rgba_dict.a);

                        
            //
            //console.log(rgb);
            //console.log(hsv);
            
            //lux = Math.round(totalValue / (self.width * self.height));
            console.log(totalValue/((self.width * self.height) / 1000));
            console.log(top_50);
            console.log(lux);
            
            self.service.getCharacteristic(Characteristic.CurrentAmbientLightLevel).setValue(lux);
        })
        .catch(err => {
            console.log("image-brightness-sensor exception!!");
        });
  },

  getServices: function() {

    this.informationService = new Service.AccessoryInformation();
  
    this.informationService
      .setCharacteristic(Characteristic.Name, this.name)
      .setCharacteristic(Characteristic.Manufacturer, "Homebridge")
      .setCharacteristic(Characteristic.Model, "Image Brightness Sensor")
      .setCharacteristic(Characteristic.SerialNumber, "WZ-18");
  
    // you can OPTIONALLY create an information service if you wish to override
    // the default values for things like serial number, model, etc.
    this.service = new Service.LightSensor();
    this.service.getCharacteristic(Characteristic.StatusActive).setValue(true);
    
    if (this.updateInterval > 0) {
      this.timer = setInterval(this.updateState.bind(this), this.updateInterval);
    }
    
    return [this.informationService, this.service];
  }
};
