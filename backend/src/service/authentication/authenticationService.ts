import { DELETE, POST } from '../../controllers/v0/utils/api/httpMethods';
import { CircuitBreakerClient } from '../../controllers/v0/utils/circuitBreaker/circuitRequest';
import { HttpClient } from '../../controllers/v0/utils/circuitBreaker/http/httpClient';
import { AbstractService } from '../abstractService';

interface AuthenticationOperations<X> {
    registerOperation(_endpointPath: string, _headers: any, _body: any): Promise<X>;
    loginOperation(_endpointPath: string, _headers: any, _body: any): Promise<X>;
    authenticateTokenOperation(_endpointPath: string, _headers: any, _body: any): Promise<X>;
    deleteOperation(_endpointPath: string, _headers: any, _body: any): Promise<X>;
}

class AuthenticationService<T extends HttpClient<X>, X>
    extends AbstractService<T, X>
    implements AuthenticationOperations<X>
{
    constructor(circuitBreaker: CircuitBreakerClient<T, X>, endpoint: string) {
        super(circuitBreaker, endpoint);
    }

    public async registerOperation(endpointPath: string, headers: any, body: any): Promise<X> {
        return this.circuitBreaker.fireRequest(this.endpoint, POST, endpointPath, headers, body);
    }

    public loginOperation(endpointPath: string, headers: any, body: any): Promise<X> {
        return this.circuitBreaker.fireRequest(this.endpoint, POST, endpointPath, headers, body);
    }

    public authenticateTokenOperation(endpointPath: string, headers: any, body: any): Promise<X> {
        return this.circuitBreaker.fireRequest(this.endpoint, POST, endpointPath, headers, body);
    }

    public deleteOperation(endpointPath: string, headers: any, body: any): Promise<X> {
        return this.circuitBreaker.fireRequest(this.endpoint, DELETE, endpointPath, headers, body);
    }
}

export { AuthenticationService };
