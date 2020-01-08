/**
 * @NApiVersion 2.0
 * @NModuleScope SameAccount
 */
define([], function() {
	/**
	 * @param {serverWidget} serverWidget
	 * @param {error} error
	 * @param {search} search
	 * @param {module:crypto-metadata} metadata
	 * @param {module:serverWidget-util} serverWidgetUtil
	 * @param {Qs} qs
	 */
	function formRequestFactory(
		serverWidget,
		error,
		search,
		metadata,
		serverWidgetUtil,
		qs
	) {
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

			// use qs to avoid NetSuite's suitelet's wrong query string array parsing
			var parameters = qs.parse(qs.stringify(params.request.parameters));

			var form = serverWidgetUtil.createForm(serverWidget, {
				title: 'Crypto Form',
				hideNavBar: false,
				clientScriptModulePath: '../crypto-form-client',
			});

			serverWidgetUtil.addFieldGroup(form, {
				id: fieldGroupIds.primaryInformation,
				label: 'Primary Information',
				isSingleColumn: true,
			});

			var fieldType = parameters[fieldIds.fieldType];
			switch (fieldType) {
				case fieldTypeValues.credentialField:
					serverWidgetUtil.addCredentialField(form, {
						id: fieldIds.credential,
						label: 'Credential',
						restrictToScriptIds: getScriptIds(
							parameters[sublistIds.restrictToScriptIds]
						),
						restrictToDomains: parameters[sublistIds.restrictToDomains],
						restrictToCurrentUser:
							parameters[fieldIds.restrictToCurrentUser] === 'T',
						container: fieldGroupIds.primaryInformation,
						maxLength: parseInt(parameters[fieldIds.maxLength], 10),
						help:
							'Set the credential into this field. NetSuite will replace the value of this field with a GUID when the field loses focus.',
					});
					break;
				case fieldTypeValues.secretKeyField:
					serverWidgetUtil.addSecretKeyField(form, {
						id: fieldIds.secretKey,
						label: 'Secret Key',
						restrictToScriptIds: getScriptIds(
							parameters[sublistIds.restrictToScriptIds]
						),
						restrictToCurrentUser:
							parameters[fieldIds.restrictToCurrentUser] === 'T',
						container: fieldGroupIds.primaryInformation,
						maxLength: parseInt(parameters[fieldIds.maxLength], 10),
						help:
							'Set the secret key into this field. NetSuite will replace the value of this field with a GUID when the field loses focus.',
					});
					break;
				default:
					throw error.create({
						name: 'NS_CRYPTO_ASSISTANT_UNKNOWN_FIELD_TYPE',
						message: 'Unknown field type: ' + fieldType,
					});
			}

			serverWidgetUtil.addField(form, {
				id: fieldIds.guid,
				label: 'GUID',
				type: serverWidget.FieldType.TEXT,
				container: fieldGroupIds.primaryInformation,
				help:
					'The GUID will appear here after a value is set in the credential or secret key field',
				displayType: serverWidget.FieldDisplayType.INLINE,
			});

			serverWidgetUtil.addResetButton(form, { label: 'Reset Form' });
			serverWidgetUtil.addButton(form, {
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
