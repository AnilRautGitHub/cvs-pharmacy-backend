import {
  Injectable,
  Inject,
  ServiceUnavailableException,
  HttpException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, catchError, throwError } from 'rxjs';

export interface InventoryResponse {
  productId: string;
  stock: number;
  available: boolean;
}

export interface ReservationResponse {
  productId: string;
  quantity: number;
  reserved: number;
  availableStock: number;
}

@Injectable()
export class InventoryClientService {
  constructor(
    @Inject('INVENTORY_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  async getStock(productId: string): Promise<InventoryResponse> {
    return firstValueFrom(
      this.client
        .send<InventoryResponse>('inventory.get_stock', {
          productId,
        })
        .pipe(
          timeout(3000),
          catchError((error: unknown) => {
            const rpcError = error as {
              statusCode?: number;
              message?: string;
            };

            if (
              rpcError?.statusCode === 400 ||
              rpcError?.statusCode === 404 ||
              rpcError?.statusCode === 409
            ) {
              return throwError(
                () =>
                  new HttpException(
                    rpcError.message ?? 'Inventory request failed',
                    rpcError.statusCode!,
                  ),
              );
            }

            return throwError(
              () =>
                new ServiceUnavailableException(
                  'Inventory service is unavailable',
                ),
            );
          }),
        ),
    );
  }

  async reserveStock(
    productId: string,
    quantity: number,
  ): Promise<ReservationResponse> {
    return firstValueFrom(
      this.client
        .send<ReservationResponse>('inventory.reserve_stock', {
          productId,
          quantity,
        })
        .pipe(
          timeout(3000),
          catchError((error: unknown) => {
            const rpcError = error as {
              statusCode?: number;
              message?: string;
            };

            const statusCode = rpcError?.statusCode;

            if (
              statusCode === 400 ||
              statusCode === 404 ||
              statusCode === 409
            ) {
              return throwError(
                () =>
                  new HttpException(
                    rpcError.message ?? 'Inventory request failed',
                    statusCode,
                  ),
              );
            }

            return throwError(
              () =>
                new ServiceUnavailableException(
                  'Inventory service is unavailable',
                ),
            );
          }),
        ),
    );
  }
}
