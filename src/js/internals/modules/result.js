var assert = require("assert"),
        _ = require("underscore");

module.exports = function (controller) {

    var result = function (inputContainer, inputContent, inputResult) {
        var container = inputContainer || $("<div />").addClass("container");
        var content = inputContent || $("<div />").addClass("content");
        var result = inputResult || $("<div />").addClass("result");

        if (!inputResult)
            result.append(container.append(content));

        this.addSeparator = function (title, subtitle, description, items) {
            items = items || {};
            items.container = $("<div />").addClass("container");
            items.result = {
                oldContainer: container,
                oldContent: content
            };
            items.content = $("<div />").addClass("content");
            items.headerContainer = $("<div />").addClass("container");
            items.headerContent = $("<div />").addClass("content");
            items.headerTitle = $("<h4 />").text(title);
            items.headerSubtitle = $("<h5 />").text(subtitle);
            items.menu = $("<ul >").addClass("actions");
            items.resultsDisplay = $("<div />").addClass("results-display").text(description);

            items.headerContainer.append(items.headerContent);
            items.headerContent.append(items.headerTitle);
            items.headerContent.append(items.headerSubtitle);
            items.headerContent.append(items.resultsDisplay);
            items.headerContent.append(items.menu);

            items.addItem = function (icon) {
                var item = $('<li />').addClass("action-resize").extend($("<i />").addClass("fa fa-" + icon));
                items.menu.append(item);
                return item;
            };


            var header = $("<header />")
                    .addClass("separator")
                    .append(items.headerContainer);

            result.append(header);

            container = $("<div />").addClass("container");
            content = $("<div />").addClass("content");
            result.append(container.append(content));

            return header;
        };

        this.block = function () {
            var ret = $("<div />");
            content.append(ret);
            return ret;
        };

        var generateAlert = function (radial, percent, context) {
            context = context || {
                60: "attention",
                80: "warning"
            };
            var styleDefinition = null;

            radial.element.removeClass(_.toArray(context).join(" "));

            for (var minPerc in context) {
                if (percent < parseInt(minPerc)) {
                    break;
                }
                styleDefinition = context[minPerc];
            }

            if (styleDefinition) {
                radial.element.addClass(styleDefinition);
            }

            return radial;
        };

        this.generateRadial = function (name, percent, context) {
            var item = this.addItem(name, "").addClass("center"),
                    itemValue = item.find(".value");

            var widget = controller.interface.widgets.radialProject(itemValue, percent);

            var radial =  generateAlert(widget, percent, context);

            var change = radial.change;
            radial.change = function (percent) {
                change(percent);
                generateAlert(radial, percent, context);
            };

            return radial;
        };


        this.addItem = function (name, value, tagname) {
            var node = $("<div />").addClass("field");

            if (typeof tagname !== typeof undefined) {
                node.attr("data-tagname", tagname);
            }

            if (typeof value !== typeof undefined) {
                node.append($("<div />").addClass("value").html(value));
            }

            if (typeof name !== typeof undefined) {
                node.append($("<div />").addClass("name").text(name));
            }

            content.append(node);

            return node;
        };

        this.content = function () {
            return content;
        };

        this.element = function () {
            return result;
        };

        return this;
    };

    controller.registerCall("result", function () {
        return new result();
    });

    controller.registerCall("result::import", function (result) {
        assert.ok(result.hasClass("result"));

        var container = result.find(".container").first();
        assert.ok(container.length > 0);

        var content = container.find(".content");
        assert.ok(content.length > 0);

        return new result(container, content, result);
    });

};
