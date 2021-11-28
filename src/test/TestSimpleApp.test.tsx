import * as React from 'react';
noop(React.version);

import ConfigHandler from '../configHandler/ConfigHandler';
import {noop} from '../utils';

test('validate test config', async () => {
    const ch = new ConfigHandler(["test/simpletest"], {localMode: true});
    const rfc = await ch.genLoadFinalConfigLocalWILLTHROW();
    expect(rfc.default.configs.langConfig.config.dialects.eng_us?.displayName).toBe("English (US)");
    expect(rfc.apps["test/simpletest"]!.configs.appConfig.config.displayName).toBe("Simple Test App");
    expect(rfc.apps["test/simpletest"]!.configs.appConfig.config.defaultSubApp).toBeUndefined();
});
