/**
 * @NApiVersion 2.0
 * @NModuleScope SameAccount
 * @exports serverWidget-util
 */
define([], function() {
	var fieldMethodObject = {
		setHelpText: ['help'],
		updateBreakType: ['breakType'],
		updateDisplaySize: ['height', 'width'],
		updateDisplayType: ['displayType'],
		updateLayoutType: ['layoutType'],
	};
	var cryptoFieldProperties = [
		'alias',
		'defaultValue',
		'isMandatory',
		'maxLength',
		'padding',
	];
	var standardFieldProperties = [
		'linkText',
		'richTextHeight',
		'richTextWidth',
	].concat(cryptoFieldProperties);
	var formProperties = ['clientScriptFileId', 'clientScriptModulePath'];
	var buttonProperties = ['isDisabled', 'isHidden'];

	/**
	 * @param {Object} uiObject
	 * @param {Array} properties
	 * @param {Object} config
	 */
	function setProperties(uiObject, properties, config) {
		properties.forEach(function(property) {
			if (Object.prototype.hasOwnProperty.call(config, property)) {
				uiObject[property] = config[property];
			}
		});
	}

	/**
	 * @param {Object} uiObject
	 * @param methodsObject
	 * @param {Object} config
	 */
	function callMethods(uiObject, methodsObject, config) {
		// this bit of cleverness is required to get the value of this correct
		// otherwise expect a TypeError: can't convert undefined to object
		var boundHasOwnProperty = Object.prototype.hasOwnProperty.bind(config);

		Object.keys(methodsObject).forEach(function(method) {
			var requiredProperties = methodsObject[method];

			if (requiredProperties.every(boundHasOwnProperty)) {
				uiObject[method](config);
			}
		});
	}

	function addUiObject(
		addMethodName,
		methodObject,
		properties,
		pageObject,
		config
	) {
		var uiObject = pageObject[addMethodName](config);

		setProperties(uiObject, properties, config);

		callMethods(uiObject, methodObject, config);

		return uiObject;
	}

	return {
		/**
		 * @param {Assistant|Form} pageObject
		 * @param {Object} config
		 */
		addFieldGroup: addUiObject.bind(this, 'addFieldGroup', {}, [
			'isBorderHidden',
			'isCollapsible',
			'isCollapsed',
			'isSingleColumn',
		]),
		/**
		 * @param {Form} form
		 * @param {Object} config
		 */
		addSecretKeyField: addUiObject.bind(
			this,
			'addSecretKeyField',
			fieldMethodObject,
			cryptoFieldProperties
		),
		/**
		 * @param {Form} form
		 * @param {Object} config
		 */
		addCredentialField: addUiObject.bind(
			this,
			'addCredentialField',
			fieldMethodObject,
			cryptoFieldProperties
		),
		/**
		 * @param {Form|Assistant} pageObject
		 * @param {Object} config
		 */
		addField: function(pageObject, config) {
			var field = addUiObject(
				'addField',
				fieldMethodObject,
				standardFieldProperties,
				pageObject,
				config
			);

			if (Object.prototype.hasOwnProperty.call(config, 'selectOptions')) {
				config.selectOptions.forEach(field.addSelectOption);
			}

			return field;
		},
		/**
		 * @param {serverWidget} serverWidget
		 * @param {Object} config
		 */
		createForm: addUiObject.bind(this, 'createForm', {}, formProperties),
		/**
		 * @param {Form} pageObject
		 * @param {Object} config
		 */
		addResetButton: addUiObject.bind(
			this,
			'addResetButton',
			{},
			buttonProperties
		),
		/**
		 * @param {Form|List} pageObject
		 * @param {Object} config
		 */
		addButton: addUiObject.bind(this, 'addButton', {}, buttonProperties),
	};
});
