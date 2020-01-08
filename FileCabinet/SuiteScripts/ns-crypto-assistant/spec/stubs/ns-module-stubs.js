/**
 * @exports ns-module-stubs
 */
define(['sinon'], function(sinon) {
	function UrlStub(redirectUrl) {
		this.resolveScript = sinon.stub().returns(redirectUrl);
	}

	function CurrentRecordStub(fields) {
		fields = fields || {};

		var bodyFields = Object.keys(fields).reduce(function(bodyFields, fieldId) {
			bodyFields[fieldId] = fields[fieldId];

			return bodyFields;
		}, {});

		this.getValue = sinon.stub().callsFake(function(options) {
			var fieldId = options.fieldId;

			return bodyFields[fieldId];
		});

		this.setValue = sinon.stub().callsFake(function(options) {
			var fieldId = options.fieldId;
			var value = options.value;

			bodyFields[fieldId] = value;
		});
	}

	function ErrorStub(error) {
		this.create = sinon.stub.returns(error);
	}

	function SearchResultStub(searchResultConfig) {
		this.getValue = sinon.stub().returns(searchResultConfig.value);
	}

	function ResultSetStub(searchResultStubs) {
		this.each = sinon.stub.callsFake(function(callback) {
			var i = 0;
			var continueEach;
			do {
				continueEach = callback(searchResultStubs[i]);
			} while (i < searchResultStubs.length && continueEach);
		});
	}

	function SearchObjectStub(resultSetStub) {
		this.run = sinon.stub.returns(resultSetStub);
	}

	function SearchStub(searchObjectStub) {
		this.create = sinon.stub.returns(searchObjectStub);
	}

	function FieldGroupStub() {}

	function ButtonStub() {}

	function FieldStub() {
		this.setHelpText = sinon.stub();
		this.updateDisplaySize = sinon.stub();
		this.addSelectOption = sinon.stub();
	}

	function FormStub(fieldGroupStub, fieldStub, buttonStub) {
		this.addFieldGroup = sinon.stub().returns(fieldGroupStub);
		this.addSecretKeyField = sinon.stub().returns(fieldStub);
		this.addCredentialField = sinon.stub().returns(fieldStub);
		this.addField = sinon.stub().returns(fieldStub);
		this.addResetButton = sinon.stub().returns(buttonStub);
		this.addButton = sinon.stub().returns(buttonStub);
	}

	function ServerWidgetStub(formStub) {
		this.createForm = sinon.stub().returns(formStub);
	}

	return {
		UrlStub: UrlStub,
		CurrentRecordStub: CurrentRecordStub,
		ErrorStub: ErrorStub,
		SearchResultStub: SearchResultStub,
		ResultSetStub: ResultSetStub,
		SearchObjectStub: SearchObjectStub,
		SearchStub: SearchStub,
		FieldGroupStub: FieldGroupStub,
		ButtonStub: ButtonStub,
		FieldStub: FieldStub,
		FormStub: FormStub,
		ServerWidgetStub: ServerWidgetStub,
	};
});
