/**
 * @NApiVersion 2.0
 * @NModuleScope SameAccount
 */
define([], function() {
	/**
	 * @param {serverWidget} serverWidget
	 * @param {error} error
	 * @param {url} url
	 * @param {xml} xml
	 * @param {module:crypto-metadata} metadata
	 */
	function assistantRequestFactory(serverWidget, error, url, xml, metadata) {
		/**
		 * @param {suiteletContext} params
		 * @param {ServerRequest} params.request
		 * @param {ServerResponse} params.response
		 */
		// Use request.parameters over AssistantStep to get fields. AssistantStep
		// only works well with buttons. It does not work well for browser back or
		// refresh. It also acts weirdly on the finish step. Parameters is
		// very consistent
		function assistantRequest(params) {
			var scriptIds = metadata.scriptIds;
			var deploymentIds = metadata.deploymentIds;
			var stepIds = metadata.stepIds;
			var sublistIds = metadata.sublistIds;
			var fieldIds = metadata.fieldIds;
			var fieldTypeValues = metadata.fieldTypeValues;
			var formFields = [
				fieldIds.restrictToCurrentUser,
				fieldIds.maxLength,
				fieldIds.fieldType,
			];
			var selectOptionsFields = [
				fieldIds.restrictToCurrentUser,
				fieldIds.maxLength,
			];

			/**
			 * @param {Object} queryString
			 * @param {ServerRequest} request
			 * @param {String} groupId
			 * @param {String} nameId
			 */
			function addSublistFieldValues(queryString, request, groupId, nameId) {
				var lineCount = request.getLineCount({ group: groupId });

				for (var line = 0; line < lineCount; line++) {
					queryString[groupId + '[' + line + ']'] = request.getSublistValue({
						group: groupId,
						name: nameId,
						line: line,
					});
				}
			}

			/**
			 * @param {ServerRequest} request
			 * @returns {Object}
			 */
			function generateQueryString(request) {
				var queryString = {
					ifrmcntnr: 'T',
				};
				var parameters = request.parameters;

				formFields.forEach(function(fieldId) {
					queryString[fieldId] = parameters[fieldId];
				});

				// sadly NetSuite url module does not convert array to query correctly
				// nor does the suitelet interpret array query parameters correctly
				// annoyingly, restlets know how to do arrays correctly
				// use php style with indexes and let qs module interpret
				addSublistFieldValues(
					queryString,
					request,
					sublistIds.restrictToDomains,
					fieldIds.restrictToDomain
				);
				addSublistFieldValues(
					queryString,
					request,
					sublistIds.restrictToScriptIds,
					fieldIds.restrictToScriptId
				);

				return queryString;
			}

			/**
			 * @param {Assistant} assistant
			 * @returns {Field}
			 */
			function addTypeField(assistant) {
				var typeField = assistant.addField({
					id: fieldIds.fieldType,
					label: 'Field Type',
					type: serverWidget.FieldType.SELECT,
					source: null,
				});
				typeField.addSelectOption({
					text: 'Credential Field',
					value: fieldTypeValues.credentialField,
				});
				typeField.addSelectOption({
					text: 'Secret Key Field',
					value: fieldTypeValues.secretKeyField,
				});
				typeField.isMandatory = true;

				return typeField;
			}

			/**
			 * @param {Assistant} assistant
			 * @returns {Sublist}
			 */
			// TODO use tdljs or psl to validate domain?
			function addRestrictToDomainsSublist(assistant) {
				var restricToDomainsSublist = assistant.addSublist({
					id: sublistIds.restrictToDomains,
					label: 'Restrict to Domains',
					type: serverWidget.SublistType.INLINEEDITOR,
				});
				restricToDomainsSublist.helpText =
					'Enter the domains that the credentials can be sent to, such ' +
					'as "www.mysite.com". ' +
					'Credentials cannot be sent to a domain not specified here.';

				return restricToDomainsSublist;
			}

			/**
			 * @param {Assistant} assistant
			 * @returns {Sublist}
			 */
			function addRestrictToScriptIdsSublist(assistant) {
				var restrictToScriptIdsSublist = assistant.addSublist({
					id: sublistIds.restrictToScriptIds,
					label: 'Restrict to Script Ids',
					type: serverWidget.SublistType.INLINEEDITOR,
				});
				restrictToScriptIdsSublist.helpText =
					'Select the scripts that are allowed to use the GUID.';

				return restrictToScriptIdsSublist;
			}

			/**
			 * @param {Assistant} assistant
			 * @returns {Field}
			 */
			function addRestrictToCurrentUserField(assistant) {
				var userRestrictField = assistant.addField({
					id: fieldIds.restrictToCurrentUser,
					label: 'Restrict To Current User',
					type: serverWidget.FieldType.CHECKBOX,
				});
				userRestrictField.setHelpText({
					help:
						'Select whether use of the GUID is restricted to the same ' +
						'user that originally entered the value represented by the ' +
						'GUID.',
					showInlineForAssistant: true,
				});
				// Sad day for SuiteScript 2.0 that Checkbox still needed "F"
				userRestrictField.defaultValue = 'F';

				return userRestrictField;
			}

			/**
			 * @param {Assistant} assistant
			 * @returns {Field}
			 */
			function addMaxLengthField(assistant) {
				var maxLengthField = assistant.addField({
					id: fieldIds.maxLength,
					label: 'Max Length',
					type: serverWidget.FieldType.INTEGER,
				});

				// hmac-sha512 has the largest block size of 1024 bits (128 bytes)
				// in hmac, keys longer than the block size are hashed first
				// 128 bytes is 172 characters long in base64
				// and 256 characters long in hex
				// TODO test credential max length
				maxLengthField.setHelpText({
					help:
						'Set the maximum length for the GUID generating field. This ' +
						'value is unlikely to be longer than 172 characters for ' +
						'base64 encoding or 256 characters for hex encoding when ' +
						'used for a secret key. ' +
						'Anything goes for a credential field; the maximum value for ' +
						'the length can be up to 2147483647',
					showInlineForAssistant: true,
				});
				maxLengthField.isMandatory = true;
				maxLengthField.defaultValue = 256;

				return maxLengthField;
			}

			/**
			 * @param {Sublist} sublist
			 * @returns {Field}
			 */
			function addRestrictToDomainField(sublist) {
				var restrictToDomainField = sublist.addField({
					id: fieldIds.restrictToDomain,
					label: 'Restrict To Domain',
					type: serverWidget.FieldType.TEXT,
				});
				restrictToDomainField.isMandatory = true;
				sublist.updateUniqueFieldId({
					id: fieldIds.restrictToDomain,
				});

				return restrictToDomainField;
			}

			/**
			 * @param {Sublist} sublist
			 * @returns {Field}
			 */
			function addRestrictToScriptIdField(sublist) {
				var restrictToScriptIdField = sublist.addField({
					id: fieldIds.restrictToScriptId,
					label: 'Restrict To Script Id',
					type: serverWidget.FieldType.SELECT,
					source: '-417', // TODO find a better id for Script
				});
				restrictToScriptIdField.isMandatory = true;
				sublist.updateUniqueFieldId({
					id: fieldIds.restrictToScriptId,
				});

				return restrictToScriptIdField;
			}

			/**
			 * @param {Assistant} assistant
			 */
			function addSelectFieldTypeStep(assistant) {
				var selectFieldTypeStep = assistant.addStep({
					id: stepIds.selectFieldType,
					label: 'Select Field Type',
				});
				selectFieldTypeStep.helpText =
					'Select the type of field you will be using. ' +
					'Both types take text and return a globally unique identifier ' +
					'(GUID). ' +
					'Modules that support GUIDs will replace instance of the GUID with ' +
					'the text value entered into the field.';

				return selectFieldTypeStep;
			}

			/**
			 * @param {Assistant} assistant
			 */
			function addSelectOptionsStep(assistant) {
				var selectOptionsStep = assistant.addStep({
					id: stepIds.selectOptions,
					label: 'Select Options',
				});
				selectOptionsStep.helpText =
					'Select the type of restrictions for the GUID. ' +
					'At the very least, NetSuite requires restrictions on which ' +
					'scripts are allowed to access a GUID.';

				return selectOptionsStep;
			}

			/**
			 * Validates the sublist since there is no way to force non-empty sublists
			 * @param {ServerRequest} request
			 */
			function hasValidSublists(request) {
				var hasRestrictToDomains =
					request.getLineCount({
						group: sublistIds.restrictToDomains,
					}) > 0;
				var hasRestrictToScriptIds =
					request.getLineCount({
						group: sublistIds.restrictToScriptIds,
					}) > 0;
				var fieldType = request.parameters[fieldIds.fieldType];

				switch (fieldType) {
					case fieldTypeValues.credentialField:
						return hasRestrictToDomains && hasRestrictToScriptIds;
					case fieldTypeValues.secretKeyField:
						return hasRestrictToScriptIds;
					default:
						throw error.create({
							name: 'NS_CRYPTO_ASSISTANT_UNKNOWN_FIELD_TYPE_VALUE',
							message: 'Unknown field tpye value: ' + fieldType,
						});
				}
			}

			/**
			 * @param {Assistant} assistant
			 * @param {ServerRequest} request
			 * @param {String} sublistId
			 * @param {String} fieldId
			 */
			function addPreviousSublistOptions(
				assistant,
				request,
				sublistId,
				fieldId
			) {
				var sublistCount = request.getLineCount({
					group: sublistId,
				});

				if (!sublistCount) {
					return;
				}

				var sublist = assistant.getSublist({ id: sublistId });

				for (var line = 0; line < sublistCount; line++) {
					var previousSublistValue = request.getSublistValue({
						group: sublistId,
						name: fieldId,
						line: line,
					});

					sublist.setSublistValue({
						id: fieldId,
						line: line,
						value: previousSublistValue,
					});
				}
			}

			/**
			 * @param {Assistant} assistant
			 * @param {ServerRequest} request
			 */
			function addPreviousOptions(assistant, request) {
				var parameters = request.parameters;
				var defaultValues = selectOptionsFields.reduce(function(
					defaultValues,
					fieldId
				) {
					defaultValues[fieldId] = parameters[fieldId];

					return defaultValues;
				},
				{});
				assistant.updateDefaultValues(defaultValues);

				addPreviousSublistOptions(
					assistant,
					request,
					sublistIds.restrictToScriptIds,
					fieldIds.restrictToScriptId
				);
				addPreviousSublistOptions(
					assistant,
					request,
					sublistIds.restrictToDomains,
					fieldIds.restrictToDomain
				);
			}

			// Sadly the splash does not appear to work
			// nor does client script (its added to page but not used)
			var assistant = serverWidget.createAssistant({
				title: 'Crypto Assistant',
				hideNavBar: false,
			});
			if (assistant.hasErrorHtml()) {
				assistant.errorHtml = null;
			}

			var selectFieldTypeStep = addSelectFieldTypeStep(assistant);
			var selectOptionsStep = addSelectOptionsStep(assistant);

			var lastAction = assistant.getLastAction();
			var request = params.request;
			var hasPreviousOptions = false;

			switch (lastAction) {
				// theoretically the JUMP case should be impossible
				case serverWidget.AssistantSubmitAction.JUMP:
				case serverWidget.AssistantSubmitAction.BACK:
				case serverWidget.AssistantSubmitAction.NEXT:
					assistant.currentStep = assistant.getNextStep();
					break;
				case serverWidget.AssistantSubmitAction.FINISH:
					if (hasValidSublists(request)) {
						var qs = generateQueryString(request);

						// try to avoid setting domain in url, it won't work in debug domain
						var formSuiteletUrl = url.resolveScript({
							scriptId: scriptIds.cryptoForm,
							deploymentId: deploymentIds.cryptoForm,
							returnExternalUrl: false,
							params: qs,
						});

						// TODO find a better way to hide scroll bars than 99%
						assistant.finishedHtml =
							'<iframe src="' +
							xml.escape({ xmlText: formSuiteletUrl }) +
							'" style="position: absolute; height: 99%; width: 99%;' +
							' border: none;">';
						assistant.isFinished(true);
						assistant.currentStep = selectFieldTypeStep;
					} else {
						// 42 px centers the error icon
						// TODO learn if there is a better way than hardcoding 42
						assistant.errorHtml =
							'<p style="height: 42px; display: flex; align-items: center">' +
							'Please add lines for all sublists</p>';
						assistant.currentStep = selectOptionsStep;
						hasPreviousOptions = true;
					}
					break;
				case serverWidget.AssistantSubmitAction.CANCEL:
				default:
					// represents fresh start for the next assistant
					assistant.currentStep = selectFieldTypeStep;
			}

			switch (assistant.currentStep.id) {
				case stepIds.selectFieldType:
					var typeField = addTypeField(assistant);
					typeField.setHelpText({
						help:
							'Select the type of field which matches the module that will ' +
							'be used. ' +
							'Credential field GUIDs are used by N/https and N/sftp when ' +
							'invoking services provided by third parties. ' +
							'Secret Key field GUIDs are used by N/crypto for hash-based ' +
							'message authentication (HMAC) and symmetrical encryption.',
						showInlineForAssistant: true,
					});

					break;
				case stepIds.selectOptions:
					var fieldType = request.parameters[fieldIds.fieldType];
					var disabledTypeField = addTypeField(assistant);
					disabledTypeField.updateDisplayType({
						displayType: serverWidget.FieldDisplayType.DISABLED,
					});
					disabledTypeField.defaultValue = fieldType;

					if (fieldType === fieldTypeValues.credentialField) {
						var domainsRestrictSublist = addRestrictToDomainsSublist(assistant);
						addRestrictToDomainField(domainsRestrictSublist);
					}

					var restrictToScriptIdsSublist = addRestrictToScriptIdsSublist(
						assistant
					);
					addRestrictToScriptIdField(restrictToScriptIdsSublist);

					addRestrictToCurrentUserField(assistant);
					addMaxLengthField(assistant);

					if (hasPreviousOptions) {
						addPreviousOptions(assistant, request);
					}

					break;
				default:
					throw error.create({
						name: 'NS_CRYPTO_ASSISTANT_UNKNOWN_STEP',
						message: 'Unknown step: ' + JSON.stringify(assistant.currentStep),
					});
			}

			params.response.writePage(assistant);
		}

		return { onRequest: assistantRequest };
	}

	return assistantRequestFactory;
});
