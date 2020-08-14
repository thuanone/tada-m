import React from 'react';

// coligo
import { IUIRegistrySecret } from '../../../common/model/config-model';
import t from '../i18n';

const REGISTRY_OPTION_USEPUBLIC = 'clg.component.registrySelector.default.usepublic.label';

const value = (registry: IUIRegistrySecret) => {
    // in case of a predefined registry option (e.g. add new, or use public), we only want to translate the default label
    if (isDummRegistry(registry)) {
        return t(registry.name);
    }

    return t('clg.component.registrySelector.item.label', { name: registry.name, server: registry.server, username: registry.username });
};

const getDummyUsePublicRegisty = () => {
    return { name: REGISTRY_OPTION_USEPUBLIC };
};

const isUsePublic = (registry: IUIRegistrySecret) => {
    return registry && registry.name === REGISTRY_OPTION_USEPUBLIC;
};

const isDummRegistry = (registry: IUIRegistrySecret) => {
    if (!registry) {
        return true;
    }
    return isUsePublic(registry);
};

export default { getDummyUsePublicRegisty, isDummRegistry, isUsePublic, value };
