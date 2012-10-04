(function ($) {
	var 
		fontsize_measurer_id = "fontsize-measurer__" + (+new Date()),
		block_style = "position:relative;display:inline;width:auto;",
		block_span_style = "color:transparent;display:inline;position:relative;z-index:2;cursor:inherit;white-space:nowrap;vertical-align:baseline;",
		text_blocks = [],
		fontsize_measurer,
		fontsize_measurer_value = 0,
		svg_defs_cache = {},
		blocks_count_total = 0,
		blocks_count_updated = 0,
		elements,
		svg_pattern_prefix = "pattern__",
		NS = {
			xhtml: "http://www.w3.org/1999/xhtml",
			svg: "http://www.w3.org/2000/svg",
			xlink: "http://www.w3.org/1999/xlink"
		};
	
	function getCSSValue(obj, prop) {
		return $(obj).css(prop);
	}

	function isSVGNativeSupported() {
		return document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1");
	}
	
	function checkImageLoaded(img, block) {
		(function recheck() {
			if (img && img.complete && img.width > 0 && img.height > 0) {
				block.img = img;

				blocks_count_updated++;
				
				updateBlock(block);

				//blocks final redrawing (bug in WebKit)
				if (blocks_count_updated == blocks_count_total) {
					updateBlocks();
				}
			} else {
				setTimeout(recheck, 10);
			}
		})();
	}
	
	function updateBlock(block) {
		var 
			span = block.span,
			svg = block.svg,
			svg_text = block.svg_text,
			
			svg_pattern = block.svg_pattern || null,
			svg_image = block.svg_image || null,

			img = block.img;

		if (svg_pattern && svg_image) {
			svg_pattern.attr("width", img.width).attr("height", img.height);
			
			svg_image.attr("width", img.width).attr("height", img.height);
		}

		svg.attr("style", "position:absolute;top:0;left:0;z-index:-1");
		
		span.attr("style", block_span_style);

		var 
			text_width = span.width(),
			text_height = span.height(),
			text_fontsize = parseFloat(getCSSValue(span, "font-size"));
		
		svg.attr("width", text_width).attr("height", text_height);
		
		svg_text.attr("font-size", text_fontsize);
	}
	
	function updateBlocks() {
		for (var i = 0, l = text_blocks.length; i < l; i++) {
			updateBlock(text_blocks[i]);
		}
	}
	
	function getFontSizeMeasurerValue() {
		return parseFloat(getCSSValue(fontsize_measurer, "font-size")) + fontsize_measurer.height() + fontsize_measurer.width();
	}
	
	function initBlocksUpdater() {
		fontsize_measurer = $(document.createElementNS(NS.xhtml, "span"));
		
		fontsize_measurer.attr("id", fontsize_measurer_id).attr("style", "display:inline;position:absolute;left:-10000px");

		fontsize_measurer.html((new Array(100)).join("&#160;"));
		
		$("body").append(fontsize_measurer);
		
		fontsize_measurer_value = getFontSizeMeasurerValue();
		
		(function updater() {
			var fontsize_measurer_value_current = getFontSizeMeasurerValue();
			
			if (fontsize_measurer_value != fontsize_measurer_value_current) { 
				updateBlocks();

				fontsize_measurer_value = fontsize_measurer_value_current;
			}
			
			setTimeout(updater, 100);
		})();
	}
	
	function createBlocks() {
		blocks_count_total = elements.length;

		if (!blocks_count_total) { //typeof document.documentElement.style.WebkitBackgroundClip == "undefined"
			return;
		}

		var 
			block,
			block_text,
			span,
			svg,
			svg_defs,
			svg_text,
			svg_pattern,
			svg_pattern_value,
			svg_image,
			helper_image,
			
			text_width,
			text_height,
			text_fontsize;
		
		elements.each(function (i) {
			block = $(this);
			
			block.attr("style", block_style);
			
			block_text = block.text();
			
			block.text("");

			span = $(document.createElementNS(NS.xhtml, "span"));

			span.html("<span>" + block_text + "</span>");
			
			span.attr("style", block_span_style + "height:" + block.height() + "px; width:" + block.width() + "px;");
			
			block.append(span);
			
			text_width = parseFloat(getCSSValue(span, "width"));
			text_height = parseFloat(getCSSValue(span, "height"));
			
			text_fontsize = parseFloat(getCSSValue(span, "font-size"));

			svg = $(document.createElementNS(NS.svg, "svg"));

			svg.attr("version", "1.1").attr("baseProfile", "full").attr("x", "0").attr("y", "0").attr("width", "0").attr("height", "0");

			svg[0].setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns",  NS.svg); 
			svg[0].setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", NS.xlink); 

			span.append(svg);
			
			span.attr("style", block_span_style);

			svg_pattern_value = block.data("pattern");

			svg_defs = $(document.createElementNS(NS.svg, "defs"));
			
			svg.append(svg_defs);
			
			svg_pattern = $(document.createElementNS(NS.svg, "pattern"));
			svg_pattern.attr("id", svg_pattern_prefix + svg_pattern_value).attr("x", "0").attr("y", "0");
			
			svg_pattern[0].setAttribute("patternUnits", "userSpaceOnUse");
			
			svg_defs.append(svg_pattern);
			
			svg_image = $(document.createElementNS(NS.svg, "image"));
			svg_image[0].setAttributeNS(NS.xlink, "xlink:href", svg_pattern_value); 
			
			svg_image.attr("x", "0").attr("y", "0");

			svg_pattern.append(svg_image);
			
			svg_defs_cache[svg_pattern_value] = svg_pattern;

			svg_text = $(document.createElementNS(NS.svg, "text"));

			svg_text.text(block_text);
			
			svg_text.attr("x", "0").attr("y", "0").attr("font-size", text_fontsize);
			
			/*! http://www.opera.com/docs/specs/opera9/svg/ */
			svg_text.attr("dominant-baseline", "text-before-edge");
			if (window.opera) { /*hack for simulating dominant-baseline: text-before-edge*/
				svg_text.attr("y",  text_fontsize);
				svg_text[0].setAttribute("textLength", text_width)
			}
			
			svg_text.attr("fill", "url(#" + svg_pattern_prefix + svg_pattern_value + ")");
			
			svg.append(svg_text);
			
			text_blocks.push({
				span: span, 
				svg: svg, 
				svg_text: svg_text, 
				svg_pattern: svg_pattern, 
				svg_image: svg_image, 
				img: null
			});

			helper_image = new Image();

			helper_image.onload = (function(img, block) {
				checkImageLoaded(img, block); //for WebKit bug 
			})(helper_image, text_blocks[i]);
			
			helper_image.src = svg_pattern_value;

			block.attr("style", block_span_style);
		});

		initBlocksUpdater();
	}

	var methods = {
		init: function (options) {
			elements = $(this);

			if (isSVGNativeSupported()) {
				createBlocks();
			}
		}
	};

	$.fn.patternizer = function (method) {
		if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method == "object" || !method) {
			return methods.init.apply(this, arguments);
		} else {
			$.error("Method " +  method + " does not exist on jQuery.patternizer");
		}
	};
})(jQuery);