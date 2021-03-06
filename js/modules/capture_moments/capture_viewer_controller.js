/**
 * The Capture Moments Viewer.
 *
 * @author Mohamed Mansour 2012 (http://mohamedmansour.com)
 * @constructor
 */
CaptureViewerController = function(controller) {
  this.controller = controller;
  this.gallery = $('#gallery');
  this.previewDialog = $('#preview-dialog');
  this.previewControls = $('#preview-controls');
  this.previousButton = $('#preview-prev');
  this.nextButton = $('#preview-next');
  this.imageViewer = $('#preview-image');
  this.galleryButton = $('#preview-gallery');
  this.saveButton = $('#preview-save');
  this.previewLoaderText = $('#preloader-text');
  this.currentID = 0;
  this.currentImageData = null;
  this.collection = null;
  this.currentScrollPosition = 0;
  this.keyPressedCallback = this.onKeyPressed.bind(this);
  
  this.previousButton.click(this.onPreviousPreview.bind(this));
  this.nextButton.click(this.onNextPreview.bind(this));
  this.galleryButton.click(this.closeDialog.bind(this));
  this.saveButton.click(this.onSaveImage.bind(this));
  this.imageViewer.click(this.onNextPreview.bind(this));
  
  this.previewLoaderText.css('top', ($(window).height() - CaptureViewerController.HEADER_HEIGHT) / 2);
  this.previewLoaderText.css('left', ($(window).width() - CaptureViewerController.PREVIEW_MARGIN) / 2);
};
CaptureViewerController.HEADER_HEIGHT = 90;
CaptureViewerController.PREVIEW_MARGIN = 200;
CaptureViewerController.PRELOADER_HEIGHT = 75;
CaptureViewerController.PRELOADER_WIDTH = 200;

CaptureViewerController.prototype.show = function(id, collection) {
  this.currentScrollPosition = window.scrollY;
  this.openDialog();
  this.currentID = id;
  this.collection = collection;
  this.previewImage();
  if (this.currentID == 0) {
    this.previousButton.attr('disabled', true);
  }
  if (this.currentID == this.collection.length - 1) {
    this.nextButton.attr('disabled', true);
  }
};

/**
 * Opens a download dialog.
 */
CaptureViewerController.prototype.openDialog = function(e) {
  window.addEventListener('keyup', this.keyPressedCallback, false);
  var self = this;
  this.gallery.animate({ left: -this.gallery.width(), opacity: 0 }, 500, function() { 
    self.previewDialog.fadeIn(250);
    self.gallery.hide();
  });
};

/**
 * Close the viewer screen.
 */
CaptureViewerController.prototype.closeDialog = function(e) {
  window.removeEventListener('keyup', this.keyPressedCallback, false);
  var self = this;
  this.previewDialog.fadeOut(250, function() {
    self.gallery.show();
    window.scrollTo(0, self.currentScrollPosition);
    self.gallery.animate({left: 0, opacity: 1}, 500);
  });
};

/**
 * Show the image on the previewer..
 */
CaptureViewerController.prototype.previewImage = function() {
  var height = $(window).height() - CaptureViewerController.HEADER_HEIGHT;
  var width = $(window).width() - CaptureViewerController.PREVIEW_MARGIN;

  var self = this;

  // Loader
  this.previewLoaderText.css('top', height / 2);
  this.previewLoaderText.css('left', width / 2);

  // Show the progress.
  this.controller.toggleProgress();

  // Query DB to find the capture.
  this.controller.findCapture(this.collection[this.currentID], function(data) {
    self.currentImageData = data;
    
    // Create a new Image add it to DOM.
    self.imageViewer.children().fadeOut(function() {
      $(this).remove();
    });
    var image = new Image();
    image.src = self.currentImageData.active;
    self.currentViewDimensions = self.adjustResolution({
      width: self.currentImageData.active_width,
      height: self.currentImageData.active_height
    });
    image.width = self.currentViewDimensions.width;
    image.height = self.currentViewDimensions.height;
    image.style.left = ($(window).width() - image.width) / 2 + 'px';
    image.style.display = 'none';
    self.imageViewer.append(image);

    // Render the new preview dialog and loader in the middle of the screen.
    var dialogMidHeight = (height - self.currentViewDimensions.height) / 2;
    self.previewDialog.css('top', dialogMidHeight);
    self.previewControls.css('top', -dialogMidHeight);

    // Stop the progress.
    $(image).fadeIn(function() {
      self.controller.toggleProgress();
    });
  });
};

/**
 * Preview the previous image.
 */
CaptureViewerController.prototype.onPreviousPreview = function() {
  if (this.currentID > 0) {
    this.currentID -= 1;
    this.previousButton.attr('disabled', false);
    this.nextButton.attr('disabled', false);
  }
  else {
    this.currentID = 0;
    this.previousButton.attr('disabled', true);
  }
  this.previewImage();
};

/**
 * Preview the next image.
 */
CaptureViewerController.prototype.onNextPreview = function() {
  if (this.currentID < (this.collection.length - 1)) {
    this.currentID += 1;
    this.previousButton.attr('disabled', false);
    this.nextButton.attr('disabled', false);
  }
  else { 
    this.currentID = this.collection.length - 1;
    this.nextButton.attr('disabled', true);
  }
  this.previewImage();
};

/**
 * Call the saving service.
 */
CaptureViewerController.prototype.onSaveImage = function(e) {
    this.controller.captureDownloader.prepareDownload(this.currentImageData);
};

/**
 * Does a FIT algorithm for letting the image fit to the container.
 *
 * @param {object} resolution The resolution for the original image.
 */
CaptureViewerController.prototype.adjustResolution = function(resolution) {
  var width = resolution.width;
  var height = resolution.height;
  var max_resolution = {
    width: ($(window).width() - CaptureViewerController.PREVIEW_MARGIN),
    height: ($(window).height() - CaptureViewerController.HEADER_HEIGHT)
  }
  // Check if the current width is larger than the max
  if (width > max_resolution.width) {
    var ratio = max_resolution.width / width;
    height = height * ratio;
    width = width * ratio;
  }

  // Check if current height is larger than max
  if (height > max_resolution.height) {
    var ratio = max_resolution.height / height;
    height = max_resolution.height;
    width = width * ratio;
  }

  return {
    width: width,
    height: height
  };
};

/**
 * Key Pressed Events to handle gallery navigations.
 */
CaptureViewerController.prototype.onKeyPressed = function (e) {
  if (e.keyCode == 27) { // ESCAPE.
    this.closeDialog();
  }
  else if (e.keyCode == 37) { // LEFT
    this.onPreviousPreview();
  }
  else if (e.keyCode == 39) { // RIGHT
    this.onNextPreview();
  }
};