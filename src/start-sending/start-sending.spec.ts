import { Test, TestingModule } from '@nestjs/testing';
import { StartSending } from './start-sending';

describe('StartSending', () => {
  let provider: StartSending;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StartSending],
    }).compile();

    provider = module.get<StartSending>(StartSending);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
