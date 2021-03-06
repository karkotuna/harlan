/* global module */
var uniqid = require('uniqid'),
        CreateList = require("./create-list");

module.exports = function (instance, controller) {

    var form = $("<form />");
    instance.element().append(form);

    var createLabel = function (input, obj, labelText, placeholder) {
        if (!obj) {
            obj = {};
        }

        if (obj) {
            input.addClass("has-label").attr('id', (obj.id = uniqid()));
            obj.label = $("<label />")
                    .addClass("input-label")
                    .attr({'for': obj.id})
                    .html(labelText || placeholder);

            if (obj.class) {
                obj.label.addClass(obj.class);
                input.addClass(obj.class);
            }

            input[obj.labelPosition || "after"](obj.label);
        }
    };

    this.multiField = function () {
        var div = $("<div />").addClass("multi-field");
        form.append(div);
        return div;
    };

    this.addSelect = function (id, name, list, obj, labelText, value) {

        obj = obj || {};

        var select = $("<select />").attr({
            id: id,
            name: name
        });

        obj.options = {};
        for (var i in list) {
            obj.options[i] = select.append($("<option />").attr({
                value: i
            }).text(list[i]));
        }

        if (value) {
            select.val(value);
        }

        var a = obj.append || form;
        a.append(select);
        createLabel(select, obj, labelText);

        return select;
    };

    this.createList = function () {
        return new CreateList(form);
    };

    this.addTextarea = function (name, placeholder, obj, labelText, value) {
        obj = obj || {};

        var input = $("<textarea />").attr({
            name: name,
            placeholder: placeholder,
            autocomplete: false,
            autocapitalize: false
        }).text(value);

        var a = obj.append || form;
        a.append(input);
        createLabel(input, obj, labelText, placeholder);

        return input;
    };

    this.addInput = function (name, type, placeholder, obj, labelText, value) {
        obj = obj || {};

        var input = $("<input />").attr({
            name: name,
            type: type,
            placeholder: placeholder,
            autocomplete: false,
            autocapitalize: false,
            value: value
        });

        var a = obj.append || form;
        a.append(input);
        createLabel(input, obj, labelText, placeholder);

        return input;
    };

    this.cancelButton = function (text, onCancel) {
        return this.addSubmit("cancel", text || controller.i18n.system.cancel()).click(function (e) {
            e.preventDefault();
            if (onCancel) {
                onCancel();
            } else {
                instance.close();
            }
        });
    };

    this.addCheckbox = function (name, label, checked, value, item) {
        var elementId = uniqid();
        item = item || {};

        var checkbox = $("<input />").attr({
            type: "checkbox",
            checked: checked,
            value: (typeof value === "undefined" ? "1" : value),
            id: elementId
        });

        var lblItem;
        var div = $("<div />")
                .addClass("checkbox")
                .append(checkbox)
                .append(lblItem = $("<label/>").attr("for", elementId).html(label));

        (item.append || form).append(div);
        return [div, checkbox, lblItem];
    };

    this.addSubmit = function (name, value) {
        var submit = $("<input />").attr({
            type: "submit",
            value: value,
            name: name
        }).addClass("button");

        form.append(submit);
        return submit;
    };

    this.element = function () {
        return form;
    };

    return this;
};
