import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type ReservationDocument = HydratedDocument<Reservation>;

export enum ReservationStatus {
  ACTIVE = 'ACTIVE',
  RELEASED = 'RELEASED',
}

@Schema({ timestamps: true })
export class Reservation {
  @Prop({ type: String, required: true, unique: true })
  reservationId!: string;

  @Prop({ type: String, required: true })
  productId!: string;

  @Prop({ type: Number, required: true, min: 1 })
  quantity!: number;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(ReservationStatus),
    default: ReservationStatus.ACTIVE,
  })
  status!: ReservationStatus;
}

export const ReservationSchema = SchemaFactory.createForClass(Reservation);
