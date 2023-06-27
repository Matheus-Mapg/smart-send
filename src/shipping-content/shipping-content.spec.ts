import { Test, TestingModule } from '@nestjs/testing';
import { ShippingContent } from './shipping-content';

describe('ShippingContent', () => {
  let provider: ShippingContent;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShippingContent],
    }).compile();

    provider = module.get<ShippingContent>(ShippingContent);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
