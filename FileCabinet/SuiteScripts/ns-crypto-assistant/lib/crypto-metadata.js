/**
 * @NApiVersion 2.0
 * @NModuleScope SameAccount
 * @exports crypto-metadata
 */
define([], function() {
	return {
		scriptIds: {
			cryptoAssistant: 'customscript_ns_crypto_assistant',
			cryptoForm: 'customscript_ns_crypto_form',
		},
		deploymentIds: {
			cryptoAssistant: 'customdeploy_ns_crypto_assistant',
			cryptoForm: 'customdeploy_ns_crypto_form',
		},
		stepIds: {
			selectFieldType: 'custpage_select_field_type',
			selectOptions: 'custpage_select_options',
		},
		sublistIds: {
			restrictToDomains: 'custpage_restrict_to_domains',
			restrictToScriptIds: 'custpage_restrict_to_script_ids',
		},
		fieldIds: {
			fieldType: 'custpage_field_type',
			restrictToDomain: 'custpage_restrict_to_domain',
			maxLength: 'custpage_max_length',
			restrictToCurrentUser: 'custpage_restrict_to_current_user',
			restrictToScriptId: 'custpage_restrict_to_script_id',
			secretKey: 'custpage_secret_key',
			credential: 'custpage_credential',
			guid: 'custpage_guid',
		},
		buttonIds: {
			restartAssistant: 'custpage_restart_assistant',
		},
		fieldTypeValues: {
			credentialField: 'custpage_credential_field',
			secretKeyField: 'custpage_secret_key_field',
		},
		fieldGroupIds: {
			primaryInformation: 'custpage_primary_information',
		},
	};
});
