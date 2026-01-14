export declare class AccountsController {
    getAccounts(): {
        accounts: {
            id: string;
            currency: string;
            balance: number;
            isMain: boolean;
        }[];
    };
    createAccount(body: {
        currency: string;
    }): {
        id: string;
        currency: string;
        balance: number;
        isMain: boolean;
    };
    getAccount(accountId: string): {
        id: string;
        currency: string;
        balance: number;
        iban: string;
    };
    getAccountDetails(accountId: string): {
        iban: string;
        bic: string;
        accountHolder: string;
        bankName: string;
        bankAddress: string;
    };
    setMainAccount(accountId: string): {
        message: string;
    };
    getTotalBalance(currency?: string): {
        totalBalance: number;
        currency: string;
    };
    getStatements(accountId: string, from: string, to: string): {
        statements: any[];
        accountId: string;
        from: string;
        to: string;
    };
    exportStatement(accountId: string, body: {
        format: 'pdf' | 'csv';
        from: string;
        to: string;
    }): {
        downloadUrl: string;
    };
}
