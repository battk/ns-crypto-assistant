/**
 * @NApiVersion 2.0
 * @NModuleScope SameAccount
 * @module form-client-factory
 */
define([], function() {
	/**
	 * @param {window} window
	 * @param {url} url
	 * @param {module:crypto-metadata} metadata
	 * @alias module:form-client-factory
	 */
	function formClientFactory(window, url, metadata) {
		var scriptIds = metadata.scriptIds;
		var deploymentIds = metadata.deploymentIds;
		var fieldIds = metadata.fieldIds;

		function restartCryptoAssistant() {
			var assistantSuiteletUrl = url.resolveScript({
				scriptId: scriptIds.cryptoAssistant,
				deploymentId: deploymentIds.cryptoAssistant,
				returnExternalUrl: false,
			});

			window.top.location.href = assistantSuiteletUrl;
		}

		/**
		 * @param {Object} scriptContext
		 * @param scriptContext.currentRecord
		 * @param {String} scriptContext.sublistId
		 * @param {String} scriptContext.fieldId
		 * @param {String} scriptContext.line
		 * @param {String} scriptContext.column
		 */
		function fieldChanged(scriptContext) {
			var currentRecord = scriptContext.currentRecord;

			switch (scriptContext.fieldId) {
				case fieldIds.secretKey:
				case fieldIds.credential:
					var guid = currentRecord.getValue({ fieldId: scriptContext.fieldId });
					currentRecord.setValue({ fieldId: fieldIds.guid, value: guid });
					break;
			}
		}

		return {
			restartCryptoAssistant: restartCryptoAssistant,
			fieldChanged: fieldChanged,
		};
	}

	return formClientFactory;
});
