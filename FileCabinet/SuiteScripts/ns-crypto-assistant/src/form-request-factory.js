/**
 * @NApiVersion 2.0
 * @NModuleScope SameAccount
 */
define([], function() {
	/**
	 * @param {serverWidget} serverWidget
	 * @param {error} error
	 * @param {url} url
	 * @param {search} search
	 * @param {module:crypto-metadata} metadata
	 * @param {Qs} qs
	 */
	function formRequestFactory(serverWidget, error, url, search, metadata, qs) {
		/**
		 * @param {suiteletContext} params
		 * @param {ServerRequest} params.request
		 * @param {ServerResponse} params.response
		 */
		function formRequest(params) {
			var sublistIds = metadata.sublistIds;
			var fieldIds = metadata.fieldIds;
			var fieldTypeValues = metadata.fieldTypeValues;
			var buttonIds = metadata.buttonIds;
			var fieldGroupIds = metadata.fieldGroupIds;

			function getScriptIds(restrictToScriptInternalIds) {
				var scriptIds = [];
				var scriptSearch = search.create({
					type: 'script',
					filters: [
						'internalid',
						search.Operator.ANYOF,
						restrictToScriptInternalIds,
					],
					columns: { name: 'scriptid' },
				});

				// I refuse to believe that some madman will select over 4000 scripts
				scriptSearch.run().each(function(result) {
					scriptIds.push(result.getValue({ name: 'scriptid' }));

					return true;
				});

				return scriptIds;
			}

			function addPrimaryInformationFieldGroup(form) {
				var primaryInformationFieldGroup = form.addFieldGroup({
					id: fieldGroupIds.primaryInformation,
					label: 'Primary Information',
				});
				primaryInformationFieldGroup.isBorderHidden = false;
				primaryInformationFieldGroup.isSingleColumn = true;

				return primaryInformationFieldGroup;
			}

			function addSecretKeyField(form, parameters) {
				var restrictToScriptInternalIds =
					parameters[sublistIds.restrictToScriptIds];
				var restrictToCurrentUser =
					parameters[fieldIds.restrictToCurrentUser] === 'T';
				var maxLength = parseInt(parameters[fieldIds.maxLength], 10);
				var restrictToScriptIds = getScriptIds(restrictToScriptInternalIds);

				var secretKeyField = form.addSecretKeyField({
					id: fieldIds.secretKey,
					label: 'Secret Key',
					restrictToScriptIds: restrictToScriptIds,
					restrictToCurrentUser: restrictToCurrentUser,
					container: fieldGroupIds.primaryInformation,
				});
				secretKeyField.maxLength = maxLength;
				secretKeyField.setHelpText({
					help:
						'Set the secret key into this field. NetSuite will replace the ' +
						'value of this field with a GUID when the field loses focus.',
				});
			}

			function addCredentialField(form, parameters) {
				var restrictToScriptInternalIds =
					parameters[sublistIds.restrictToScriptIds];
				var restrictToDomains = parameters[sublistIds.restrictToDomains];
				var restrictToCurrentUser =
					parameters[fieldIds.restrictToCurrentUser] === 'T';
				var maxLength = parseInt(parameters[fieldIds.maxLength], 10);
				var restrictToScriptIds = getScriptIds(restrictToScriptInternalIds);

				var credentialField = form.addCredentialField({
					id: fieldIds.credential,
					label: 'Credential',
					restrictToScriptIds: restrictToScriptIds,
					restrictToDomains: restrictToDomains,
					restrictToCurrentUser: restrictToCurrentUser,
					container: fieldGroupIds.primaryInformation,
				});
				credentialField.maxLength = maxLength;
				credentialField.setHelpText({
					help:
						'Set the credential into this field. NetSuite will replace the ' +
						'value of this field with a GUID when the field loses focus.',
				});
			}

			function addGuidField(form) {
				var guidField = form.addField({
					id: fieldIds.guid,
					label: 'GUID',
					type: serverWidget.FieldType.TEXT,
					container: fieldGroupIds.primaryInformation,
				});

				guidField.setHelpText({
					help:
						'The GUID will appear here after a value is set in the ' +
						'credential or secret key field',
				});
				guidField.updateDisplayType({
					displayType: serverWidget.FieldDisplayType.INLINE,
				});
			}

			// use qs to avoid NetSuite's suitelet's wrong query string parsing
			var parameters = qs.parse(qs.stringify(params.request.parameters));

			var form = serverWidget.createForm({
				title: 'Crypto Form',
				hideNavBar: false,
			});
			form.clientScriptModulePath = '../crypto-form-client';
			addPrimaryInformationFieldGroup(form);

			var fieldType = parameters[fieldIds.fieldType];
			switch (fieldType) {
				case fieldTypeValues.credentialField:
					addCredentialField(form, parameters);
					break;
				case fieldTypeValues.secretKeyField:
					addSecretKeyField(form, parameters);
					break;
				default:
					throw error.create({
						name: 'NS_CRYPTO_ASSISTANT_UNKNOWN_FIELD_TYPE',
						message: 'Unknown field type: ' + fieldType,
					});
			}

			addGuidField(form);
			form.addResetButton({ label: 'Reset Form' });
			form.addButton({
				id: buttonIds.restartAssistant,
				label: 'Restart Crypto Assistant',
				functionName: 'restartCryptoAssistant',
			});

			params.response.writePage(form);
		}

		return { onRequest: formRequest };
	}

	return formRequestFactory;
});
