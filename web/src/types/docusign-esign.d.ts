// Type declarations for docusign-esign package
// This allows dynamic import without strict type checking

declare module 'docusign-esign' {
  export class ApiClient {
    constructor();
    setBasePath(basePath: string): void;
    addDefaultHeader(header: string, value: string): void;
    requestJWTUserToken(
      clientId: string,
      userId: string,
      scopes: string[],
      privateKey: string,
      expiresIn: number
    ): Promise<{ body: { access_token: string; expires_in: number } }>;
  }

  export class EnvelopesApi {
    constructor(apiClient: ApiClient);
    createEnvelope(
      accountId: string,
      options: { envelopeDefinition: EnvelopeDefinition }
    ): Promise<{ envelopeId: string }>;
    getEnvelope(
      accountId: string,
      envelopeId: string
    ): Promise<{ status: string; completedDateTime?: string }>;
    createRecipientView(
      accountId: string,
      envelopeId: string,
      options: { recipientViewRequest: RecipientViewRequest }
    ): Promise<{ url: string }>;
    getDocument(
      accountId: string,
      envelopeId: string,
      documentId: string
    ): Promise<Buffer>;
  }

  export class Document {
    documentBase64: string;
    name: string;
    fileExtension: string;
    documentId: string;
  }

  export class Signer {
    email: string;
    name: string;
    recipientId: string;
    routingOrder: string;
    clientUserId: string;
    tabs: Tabs;
  }

  export class SignHere {
    documentId: string;
    pageNumber: string;
    recipientId: string;
    tabLabel: string;
    xPosition: string;
    yPosition: string;
  }

  export class DateSigned {
    documentId: string;
    pageNumber: string;
    recipientId: string;
    tabLabel: string;
    xPosition: string;
    yPosition: string;
  }

  export class Tabs {
    signHereTabs: SignHere[];
    dateSignedTabs: DateSigned[];
  }

  export class Recipients {
    signers: Signer[];
  }

  export class EnvelopeDefinition {
    emailSubject: string;
    emailBlurb: string;
    documents: Document[];
    recipients: Recipients;
    status: string;
  }

  export class RecipientViewRequest {
    returnUrl: string;
    authenticationMethod: string;
    email: string;
    userName: string;
    recipientId: string;
    clientUserId: string;
  }
}
