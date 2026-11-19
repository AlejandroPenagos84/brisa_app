import { ApiProperty } from '@nestjs/swagger';

export class PropertyImageResponse {
  @ApiProperty({
    description: 'Image identifier',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Image URL, relative to the API origin',
    example:
      '/uploads/properties/3fa85f64-5717-4562-b3fc-2c963f66afa6/9b1d2c3e-0000-4000-8000-000000000001.jpg',
  })
  url: string;

  @ApiProperty({ description: 'Order of the image; 0 is the cover', example: 0 })
  position: number;
}
