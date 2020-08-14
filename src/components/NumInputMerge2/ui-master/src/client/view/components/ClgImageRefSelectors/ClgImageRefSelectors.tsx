// react
import PropTypes from 'prop-types';
import React from 'react';

// 3rd-party
import * as log from 'loglevel';

// carbon + pal
import { InlineNotification, NotificationActionButton } from '@console/pal/carbon-components-react';

// coligo
import * as commonModel from '../../../../common/model/common-model';
import * as configModel from '../../../../common/model/config-model';
import * as projectModel from '../../../../common/model/project-model';
import * as containerRegistryModel from '../../../../common/model/container-registry-model';
import * as coligoValidatorConfig from '../../../../common/validator/coligo-validator-config';
import * as commonValidator from '../../../../common/validator/common-validator';
import { TextValidator } from '../../../../common/validator/text-validator';
import * as containerRegistryApi from '../../../api/container-registry-api';
import t from '../../../utils/i18n';
import ClgComboBox from '../ClgComboBox/ClgComboBox';
import * as viewCommonModel from '../../model/common-view-model';

interface IProps {
  image?: commonValidator.IClgTextField;
  onChange: (image: string) => void;
  project?: projectModel.IUIProject;
  selectedRegistry?: configModel.IUIRegistrySecret;
}

interface IState {
  errorOnImageSelection?: viewCommonModel.IClgInlineNotification;
  image?: commonValidator.IClgTextField;
  imageNamespace: viewCommonModel.IComboBoxItem;
  imageNamespaces: viewCommonModel.IComboBoxItem[];
  imageRepository: viewCommonModel.IComboBoxItem;
  imageRepositories: { [key: string]: viewCommonModel.IComboBoxItem[] };
  imageRefTarget: string;
  imageTag: viewCommonModel.IComboBoxItem;
  imageTags: { [key: string]: viewCommonModel.IComboBoxItem[] };
  isLoadingRegistryImages: boolean;
  isLoadingRegistryNamespaces: boolean;
  isLoadingRegistryRepositories: boolean;
  ownUpdate: boolean;
  selectableRepositories: viewCommonModel.IComboBoxItem[];
  selectableImages: viewCommonModel.IComboBoxItem[];
}

interface IStateUpdate {
  image?: commonValidator.IClgTextField;
  ownUpdate: boolean;
}

// setup the logger
const COMPONENT = 'ClgImageRefSelectors';
const logger = log.getLogger(COMPONENT);

class ClgImageRefSelectors extends React.Component<IProps, IState> {
  public static getDerivedStateFromProps(props: IProps, state: IState) {
    const fn = 'getDerivedStateFromProps ';
    logger.trace(`${fn}> props: '${JSON.stringify(props)}', state: ${JSON.stringify(state)}`);

    if (state.ownUpdate) {
      logger.debug(`${fn}< - no update due is own update`);
      return { ownUpdate: false };
    }

    const stateUpdate: IStateUpdate = { ownUpdate: false };

    // check whether the image has been updated
    if (!state.image || state.image.val !== props.image.val) {
      stateUpdate.image = props.image;
    }

    // check whether the state needs to be updated
    if (Object.keys(stateUpdate).length > 1) {
      logger.debug(`${fn}< state update! ${JSON.stringify(stateUpdate)}`);
      return stateUpdate;
    }

    logger.debug(`${fn}<`);
    return null;
  }

  private readonly RULES_IMAGE_NAMESPACE: commonValidator.IClgTextFieldRules = coligoValidatorConfig.default.common.imageNamespace;
  private readonly RULES_IMAGE_REPOSITORY: commonValidator.IClgTextFieldRules = coligoValidatorConfig.default.common.imageRepository;
  private readonly RULES_IMAGE_TAG: commonValidator.IClgTextFieldRules = coligoValidatorConfig.default.common.imageTag;
  private readonly textValidator: commonValidator.IClgFieldValidator = new TextValidator();

  private readonly SEPARATOR: string = '::';

  constructor(props) {
    super(props);
    logger.debug('constructor');

    this.state = {
      isLoadingRegistryImages: false,
      isLoadingRegistryNamespaces: false,
      isLoadingRegistryRepositories: false,
      imageNamespaces: [],
      imageNamespace: viewCommonModel.getNewComboBoxItem(''),
      imageRefTarget: '',
      imageRepositories: {},
      imageRepository: viewCommonModel.getNewComboBoxItem(''),
      imageTags: {},
      imageTag: viewCommonModel.getNewComboBoxItem(''),
      ownUpdate: false,
      selectableRepositories: [],
      selectableImages: [],
    };

    // image related functions
    this.loadRegistryImages = this.loadRegistryImages.bind(this);
    this.onRegistryImagesLoaded = this.onRegistryImagesLoaded.bind(this);
    this.onRegistryImagesLoadingFailed = this.onRegistryImagesLoadingFailed.bind(this);
    this.loadRegistryRepositories = this.loadRegistryRepositories.bind(this);
    this.onRegistryRepositoriesLoaded = this.onRegistryRepositoriesLoaded.bind(this);
    this.onRegistryRepositoriesLoadingFailed = this.onRegistryRepositoriesLoadingFailed.bind(this);
    this.loadRegistryNamespaces = this.loadRegistryNamespaces.bind(this);
    this.onRegistryNamespacesLoaded = this.onRegistryNamespacesLoaded.bind(this);
    this.onRegistryNamespacesLoadingFailed = this.onRegistryNamespacesLoadingFailed.bind(this);
    this.onNamespaceChange = this.onNamespaceChange.bind(this);
    this.onRepositoryChange = this.onRepositoryChange.bind(this);
    this.onTagChange = this.onTagChange.bind(this);

    // finalizer functions
    this.onImageSelected = this.onImageSelected.bind(this);
    this.validateImageParts = this.validateImageParts.bind(this);

    // helper functions
    this.getCurrentImageRefTarget = this.getCurrentImageRefTarget.bind(this);
    this.reset = this.reset.bind(this);
  }

  public componentDidMount() {
    const fn = 'componentDidMount ';
    logger.debug(`${fn}>`);
    if (this.props.selectedRegistry && this.props.project) {
      logger.debug(`${fn}- loading registry namespaces`);
      this.loadRegistryNamespaces(this.props.selectedRegistry.name);
    }
    logger.debug(`${fn}<`);
  }

  public componentDidUpdate(prevProperties: IProps, prevState: IState) {
    const fn = 'componentDidUpdate ';
    logger.debug(`${fn}>`);
    if (this.props.selectedRegistry && this.props.project) {

      if (!prevProperties.selectedRegistry || prevProperties.selectedRegistry.name !== this.props.selectedRegistry.name) {

        logger.debug(`${fn}- loading registry namespaces`);
        this.loadRegistryNamespaces(this.props.selectedRegistry.name);
      }
    }
  }

  public loadRegistryNamespaces(registryName: string) {
    const fn = 'loadRegistryNamespaces ';
    logger.debug(`${fn}> registryName: '${registryName}'`);

    if (!registryName || registryName === '') {
      logger.debug(`${fn}< abort`);
      return;
    }

    // this variable is used to check whether the selections have been changed,
    // altough longer running async requests are still in flight
    const imageRefTarget = this.getCurrentImageRefTarget();

    // reset the error state
    this.setState(() => ({
      isLoadingRegistryNamespaces: true,
      ownUpdate: true,
      imageNamespace: viewCommonModel.getNewComboBoxItem(''),
      imageRefTarget,
      imageRepository: viewCommonModel.getNewComboBoxItem(''),
      imageTag: viewCommonModel.getNewComboBoxItem(''),
    }));

    containerRegistryApi.listRegistryNamespaces(this.props.project.region, this.props.project.id, registryName)
      .then((registryNamespaces: containerRegistryModel.IUIContainerRegistryNamespace[]) => this.onRegistryNamespacesLoaded(registryNamespaces, imageRefTarget))
      .catch((requestError: commonModel.UIRequestError) => this.onRegistryNamespacesLoadingFailed(requestError, imageRefTarget));

    logger.debug(`${fn}<`);
  }

  public onRegistryNamespacesLoaded(registryNamespaces: containerRegistryModel.IUIContainerRegistryNamespace[], imageRefTarget: string) {
    const fn = 'onRegistryNamespacesLoaded ';
    logger.debug(`${fn}> ${(registryNamespaces && registryNamespaces.length)} registry namespaces, imageRefTarget: '${imageRefTarget}'`);

    // check whether the selected registry has been changed
    if (this.getCurrentImageRefTarget().split(this.SEPARATOR)[0] !== imageRefTarget.split(this.SEPARATOR)[0]) {
      logger.debug(`${fn}< abort image ref target has been meanwhile`);
      return;
    }

    const namespaces: { [key: string]: viewCommonModel.IComboBoxItem } = {};

    // iterate over all loaded namespaces
    for (const registryNamespace of registryNamespaces) {
      if (!namespaces[registryNamespace.id]) {
        namespaces[registryNamespace.id] = viewCommonModel.getNewComboBoxItem(registryNamespace.id);
      }
    }

    this.setState(() => ({
      isLoadingRegistryNamespaces: false,
      ownUpdate: true,
      imageNamespaces: Object.values(namespaces),
    }), () => {
      // set the namespace to the first one of the list (repository and image will be adjusted accordingly)
      this.onNamespaceChange(this.state.imageNamespaces[0]);
      logger.debug(`${fn}<`);
    });
  }

  public onRegistryNamespacesLoadingFailed(requestError: commonModel.UIRequestError, imageRefTarget: string) {
    const fn = 'onRegistryNamespacesLoadingFailed ';
    logger.debug(`${fn}> ${commonModel.stringifyUIRequestError(requestError)}`);

    // check whether the selected registry has been changed
    if (this.getCurrentImageRefTarget().split(this.SEPARATOR)[0] !== imageRefTarget.split(this.SEPARATOR)[0]) {
      logger.debug(`${fn}< abort image ref target has been meanwhile`);
      return;
    }

    const registryName = this.props.selectedRegistry && this.props.selectedRegistry.name;

    const errorNotification: viewCommonModel.IClgInlineNotification = {
      actionFn: () => { this.loadRegistryNamespaces(registryName); },
      actionTitle: t('clg.cmp.containerimage.selector.error.action'),
      kind: 'error',
      title: t('clg.cmp.containerimage.selector.error.namespaces.title', { registry: registryName }),
    };
    this.setState({
      errorOnImageSelection: errorNotification,
      isLoadingRegistryNamespaces: false,
      ownUpdate: true,
    });

    logger.debug(`${fn}<`);
  }

  public loadRegistryRepositories() {
    const fn = 'loadRegistryRepositories ';
    logger.debug(`${fn}>`);

    if (!this.state.imageNamespace || this.state.imageNamespace.id === '') {
      logger.debug(`${fn}< abort`);
      return;
    }

    // this variable is used to check whether the selections have been changed,
    // altough longer running async requests are still in flight
    const imageRefTarget = this.getCurrentImageRefTarget();

    // reset the error state
    this.setState(() => ({
      isLoadingRegistryRepositories: true,
      ownUpdate: true,
      errorOnImageSelection: undefined,
      imageRefTarget,
      imageRepository: viewCommonModel.getNewComboBoxItem(''),
      imageTag: viewCommonModel.getNewComboBoxItem(''),
    }));

    containerRegistryApi.listRegistryRepositoriesOfNamespace(this.props.project.region, this.props.project.id, this.props.selectedRegistry.name, this.state.imageNamespace.id, this.state.imageRepository.id)
      .then((registryRepositories: containerRegistryModel.IUIContainerRegistryRepository[]) => this.onRegistryRepositoriesLoaded(registryRepositories, imageRefTarget))
      .catch((requestError: commonModel.UIRequestError) => this.onRegistryRepositoriesLoadingFailed(requestError, imageRefTarget));

    logger.debug(`${fn}<`);
  }

  public onRegistryRepositoriesLoaded(registryRepositories: containerRegistryModel.IUIContainerRegistryRepository[], imageRefTarget: string) {
    const fn = 'onRegistryRepositoriesLoaded ';
    logger.debug(`${fn}> ${(registryRepositories && registryRepositories.length)} registry repositories`);

    // check whether the selected registry or namespace have been changed
    if (this.getCurrentImageRefTarget().split(this.SEPARATOR)[0] !== imageRefTarget.split(this.SEPARATOR)[0] || this.getCurrentImageRefTarget().split(this.SEPARATOR)[1] !== imageRefTarget.split(this.SEPARATOR)[1]) {
      logger.debug(`${fn}< abort image ref target has been meanwhile`);
      return;
    }

    const repositories: { [key: string]: viewCommonModel.IComboBoxItem[] } = {};

    // iterate over all loaded repositories and decompose them into several maps and arrays to allow faster access on selection changes
    for (const registryRepository of registryRepositories) {
      if (!repositories[registryRepository.namespace]) {
        repositories[registryRepository.namespace] = [];
      }
      // add the repository the list of repos with its namespace
      repositories[registryRepository.namespace].push(viewCommonModel.getNewComboBoxItem(registryRepository.repository));
    }

    logger.debug(`${fn}- repositories: '${JSON.stringify(repositories)}'`);

    this.setState(() => ({
      isLoadingRegistryRepositories: false,
      ownUpdate: true,
      imageRepositories: repositories,
      selectableRepositories: repositories[this.state.imageNamespace && this.state.imageNamespace.id],
    }), () => {

      // calculate the next best-match that could be used as selected image repository
      const newlySelectedRepository = (this.state.imageRepositories[this.state.imageNamespace.id] && this.state.imageRepositories[this.state.imageNamespace.id][0]) || viewCommonModel.getNewComboBoxItem('');

      // set the repository to the first one of the list (image will be adjusted accordingly)
      this.onRepositoryChange(newlySelectedRepository);
      logger.debug(`${fn}<`);
    });
  }

  public onRegistryRepositoriesLoadingFailed(requestError: commonModel.UIRequestError, imageRefTarget: string) {
    const fn = 'onRegistryRepositoriesLoadingFailed ';
    logger.debug(`${fn}> ${commonModel.stringifyUIRequestError(requestError)}`);

    // check whether the selected registry or namespace have been changed
    if (this.getCurrentImageRefTarget().split(this.SEPARATOR)[0] !== imageRefTarget.split(this.SEPARATOR)[0] || this.getCurrentImageRefTarget().split(this.SEPARATOR)[1] !== imageRefTarget.split(this.SEPARATOR)[1]) {
      logger.debug(`${fn}< abort image ref target has been meanwhile`);
      return;
    }

    const registryName = this.props.selectedRegistry && this.props.selectedRegistry.name;

    const errorNotification: viewCommonModel.IClgInlineNotification = {
      actionFn: () => this.loadRegistryRepositories(),
      actionTitle: t('clg.cmp.containerimage.selector.error.action'),
      kind: 'error',
      title: t('clg.cmp.containerimage.selector.error.repositories.title', { registry: registryName }),
    };
    this.setState({
      errorOnImageSelection: errorNotification,
      isLoadingRegistryRepositories: false,
      ownUpdate: true,
    });

    logger.debug(`${fn}<`);
  }

  public loadRegistryImages() {
    const fn = 'loadRegistryImages ';
    logger.debug(`${fn}>`);

    if (!this.state.imageNamespace || this.state.imageNamespace.id === '' || !this.state.imageRepository || this.state.imageRepository.id === '') {
      logger.debug(`${fn}< abort`);
      return;
    }

    // this variable is used to check whether the selections have been changed,
    // altough longer running async requests are still in flight
    const imageRefTarget = this.getCurrentImageRefTarget();

    // reset the error state
    this.setState(() => ({
      isLoadingRegistryImages: true,
      ownUpdate: true,
      errorOnImageSelection: undefined,
      imageRefTarget,
      imageTag: viewCommonModel.getNewComboBoxItem(''),
    }));

    containerRegistryApi.listRegistryImagesOfRepository(this.props.project.region, this.props.project.id, this.props.selectedRegistry.name, this.state.imageNamespace.id, this.state.imageRepository.id)
      .then((registryImages: containerRegistryModel.IUIContainerRegistryImage[]) => this.onRegistryImagesLoaded(registryImages, imageRefTarget))
      .catch((requestError: commonModel.UIRequestError) => this.onRegistryImagesLoadingFailed(requestError, imageRefTarget));

    logger.debug(`${fn}<`);
  }

  public onRegistryImagesLoaded(registryImages: containerRegistryModel.IUIContainerRegistryImage[], imageRefTarget: string) {
    const fn = 'onRegistryImagesLoaded ';
    logger.debug(`${fn}> ${(registryImages && registryImages.length)} registry images`);

    // check whether the selected registry or namespace or repository have been changed
    const currentImageRefTarget = this.getCurrentImageRefTarget();
    if (currentImageRefTarget.split(this.SEPARATOR)[0] !== imageRefTarget.split(this.SEPARATOR)[0]
      || currentImageRefTarget.split(this.SEPARATOR)[1] !== imageRefTarget.split(this.SEPARATOR)[1]
      || currentImageRefTarget.split(this.SEPARATOR)[2] !== imageRefTarget.split(this.SEPARATOR)[2]) {
      logger.debug(`${fn}< abort image ref target has been meanwhile`);
      return;
    }

    const images: { [key: string]: viewCommonModel.IComboBoxItem[] } = {};

    // iterate over all loaded images and decompose them into several maps and arrays to allow faster access on selection changes
    for (const registryImage of registryImages) {
      if (!images[`${registryImage.namespace}/${registryImage.repository}`]) {
        images[`${registryImage.namespace}/${registryImage.repository}`] = [];
      }
      // add the image the list of images with its namespace/repository
      images[`${registryImage.namespace}/${registryImage.repository}`].push(viewCommonModel.getNewComboBoxItem(registryImage.image));
    }

    logger.debug(`${fn}- images: '${JSON.stringify(images)}'`);

    this.setState(() => ({
      isLoadingRegistryImages: false,
      ownUpdate: true,
      imageTags: images,
      selectableImages: images[`${this.state.imageNamespace && this.state.imageNamespace.id}/${this.state.imageRepository && this.state.imageRepository.id}`],
    }), () => {

      // calculate the next best-match that could be used as selected image tag
      const key = `${this.state.imageNamespace.id}/${this.state.imageRepository.id}`;
      const newlySelectedImage = (this.state.imageTags[key] && this.state.imageTags[key][0]) || viewCommonModel.getNewComboBoxItem('');

      // set the tag to the first one of the list
      this.onTagChange(newlySelectedImage);
      logger.debug(`${fn}<`);
    });
  }

  public onRegistryImagesLoadingFailed(requestError: commonModel.UIRequestError, imageRefTarget: string) {
    const fn = 'onRegistryImagesLoadingFailed ';
    logger.debug(`${fn}> ${commonModel.stringifyUIRequestError(requestError)}`);

    // check whether the selected registry or namespace or repository have been changed
    const currentImageRefTarget = this.getCurrentImageRefTarget();
    if (currentImageRefTarget.split(this.SEPARATOR)[0] !== imageRefTarget.split(this.SEPARATOR)[0]
      || currentImageRefTarget.split(this.SEPARATOR)[1] !== imageRefTarget.split(this.SEPARATOR)[1]
      || currentImageRefTarget.split(this.SEPARATOR)[2] !== imageRefTarget.split(this.SEPARATOR)[2]) {
      logger.debug(`${fn}< abort image ref target has been meanwhile`);
      return;
    }

    const registryName = this.props.selectedRegistry && this.props.selectedRegistry.name;

    const errorNotification: viewCommonModel.IClgInlineNotification = {
      actionFn: () => this.loadRegistryImages(),
      actionTitle: t('clg.cmp.containerimage.selector.error.action'),
      kind: 'error',
      title: t('clg.cmp.containerimage.selector.error.images.title', { registry: registryName }),
    };
    this.setState({
      errorOnImageSelection: errorNotification,
      isLoadingRegistryImages: false,
      ownUpdate: true,
    });

    logger.debug(`${fn}<`);
  }

  public onImageSelected() {
    logger.debug('onImageSelected >');
    // grab all the information
    const newImage = `${this.props.selectedRegistry.server}/${this.state.imageNamespace.id}/${this.state.imageRepository.id}${this.state.imageTag.id === '' ? '' : `:${this.state.imageTag.id}`}`;

    logger.debug(`onImageSelected - newImage: '${newImage}'`);

    // publish the changes to the parent
    this.props.onChange(newImage);
  }

  public onNamespaceChange(namespace: viewCommonModel.IComboBoxItem) {
    const fn = 'onNamespaceChange ';
    logger.debug(`${fn}> ${JSON.stringify(namespace)}`);

    if (!namespace) {
      logger.debug(`${fn}< no namespace set`);
      return;
    }

    if ((namespace && namespace.id) === (this.state.imageNamespace && this.state.imageNamespace.id)) {
      logger.debug(`${fn}< still the same namespace`);
      return;
    }

    // validate the image namespace
    const namespaceField = commonValidator.getValidatedTextField(namespace.id, this.textValidator, this.RULES_IMAGE_NAMESPACE);
    namespace.invalid = namespaceField.invalid;

    // use the list of repositories, if it has been loaded already
    const selectableRepositories = this.state.imageRepositories[namespace.id] || [];

    logger.debug(`${fn}- all repositories: ${JSON.stringify(this.state.imageRepositories)}`);
    logger.debug(`${fn}- selectableRepositories: ${JSON.stringify(selectableRepositories)}`);

    // check whether the selected repository and image must be changed.
    const resetSelections = (namespace.id !== this.state.imageNamespace.id);
    logger.debug(`${fn}- resetSelections?: ${resetSelections}`);

    this.setState(
      () => ({
        imageNamespace: namespace,
        selectableRepositories,
        ownUpdate: true,
      }),
      () => {

        // decide whether we need to reload the repositories of the selected namespace or not
        if (!namespace.invalid && !this.state.imageRepositories[namespace.id]) {
          this.loadRegistryRepositories();
          logger.debug(`${fn}- triggered repository loading`);
        }

        // calculate the next best-match that could be used as selected image repository
        const newlySelectedRepository = this.state.selectableRepositories[0] || viewCommonModel.getNewComboBoxItem('');

        // check whether there is a need to set a new image repository selection
        if (resetSelections && newlySelectedRepository.id !== this.state.imageRepository.id) {
          // in case the names do not match or a re-set is enforced, set a new repository
          this.onRepositoryChange(newlySelectedRepository);
          logger.debug(`${fn}< updating repository`);
        } else {
          // validate if all image parts are valid
          this.validateImageParts();
          logger.debug(`${fn}< validating all image parts`);
        }
      }
    );
  }

  public onRepositoryChange(repository) {
    const fn = 'onRepositoryChange ';
    logger.debug(`${fn}> ${JSON.stringify(repository)}`);

    if (!repository) {
      logger.debug(`${fn}< no repository set`);
      return;
    }

    // validate the image repository
    const validatedField = commonValidator.getValidatedTextField(repository.id, this.textValidator, this.RULES_IMAGE_REPOSITORY);
    repository.invalid = validatedField.invalid;

    // evaluate the new list of image tags
    const selectableImages = this.state.imageTags[`${this.state.imageNamespace.id}/${repository.id}`] || [];
    logger.debug(`${fn}- all images: ${JSON.stringify(this.state.imageTags)} `);
    logger.debug(`${fn}- selectableImages: ${JSON.stringify(selectableImages)}`);

    // check whether the selected image must be changed.
    const resetSelections = (repository.id === '' || repository.id !== this.state.imageRepository.id);
    logger.debug(`${fn}- resetSelections?: ${resetSelections}`);

    this.setState(
      () => ({
        imageRepository: repository,
        selectableImages,
        ownUpdate: true,
      }),
      () => {

        // decide whether we need to reload the images of the selected namespace or not
        const key = `${this.state.imageNamespace.id}/${this.state.imageRepository.id}`;
        if (!repository.invalid && !this.state.imageTags[key]) {
          this.loadRegistryImages();
          logger.debug(`${fn}- triggered images loading`);
        }

        // calculate the next best-match that could be used as selected image tag
        const newlySelectedTag = this.state.selectableImages[0] || viewCommonModel.getNewComboBoxItem('');

        // check whether there is a need to set a new image tag selection
        if (resetSelections && (newlySelectedTag.id === '' || newlySelectedTag.id !== this.state.imageTag.id)) {
          // in case the names do not match or a re-set is enforced, set a new image tag
          this.onTagChange(newlySelectedTag);
          logger.debug(`${fn}< updating image tag`);
        } else {
          // validate if all image parts are valid
          this.validateImageParts();
          logger.debug(`${fn}< validated all image parts`);
        }
      }
    );
  }

  public onTagChange(tag) {
    const fn = 'onTagChange ';
    logger.debug(`${fn}> ${JSON.stringify(tag)}`);

    if (!tag) {
      logger.debug(`${fn}< no tag set`);
      return;
    }

    // validate the image tag
    const validatedField = commonValidator.getValidatedTextField(tag.id, this.textValidator, this.RULES_IMAGE_TAG);
    tag.invalid = validatedField.invalid;

    this.setState(
      () => ({ imageTag: tag, ownUpdate: true, }),
      () => {
        this.validateImageParts();
        logger.debug(`${fn}< validated all image parts`);
      }
    );
  }

  public renderErrorNotification(errorNotification: viewCommonModel.IClgInlineNotification) {
    if (!errorNotification) {
      return <React.Fragment />;
    }
    return (
      <div className='error-state'>
        <InlineNotification
          kind={errorNotification.kind}
          statusIconDescription={errorNotification.title}
          lowContrast={true}
          title={errorNotification.title}
          subtitle={(<span>{t(errorNotification.subtitle)}</span>)}
          onCloseButtonClick={errorNotification.actionFn}
          actions={errorNotification.actionFn &&
            (
              <NotificationActionButton
                onClick={errorNotification.actionFn}
              >
                {errorNotification.actionTitle}
              </NotificationActionButton>
            )
          }
        />
      </div>
    );
  }

  public render() {
    logger.debug(`render - imageNamespaces: '${JSON.stringify(this.state.imageNamespaces)}', isLoadingRegistryNamespaces? ${this.state.isLoadingRegistryNamespaces}`);

    // render nothing if the project is not set, properly!
    if (typeof this.props.project === 'undefined') {
      return <React.Fragment />;
    }

    return (
      <div>
        <div className='coligo-form'>
          {this.renderErrorNotification(this.state.errorOnImageSelection)}
          <ClgComboBox
            hasPlaceholderText={true}
            isLoading={this.state.isLoadingRegistryNamespaces}
            isDisabled={false}
            inputId={'container-image-panel_image-selector_namespace'}
            items={this.state.imageNamespaces}
            itemToString={undefined}
            invalid={this.state.imageNamespace && this.state.imageNamespace.invalid ? t(`clg.cmp.containerimage.selector.namespace.invalid.${this.state.imageNamespace.invalid}`) : undefined}
            light={true}
            nlsKey={'clg.cmp.containerimage.selector.namespace'}
            onChange={this.onNamespaceChange}
            selectedItem={this.state.imageNamespace}
          />

          <ClgComboBox
            hasPlaceholderText={true}
            isLoading={this.state.isLoadingRegistryNamespaces || this.state.isLoadingRegistryRepositories}
            isDisabled={false}
            inputId={'container-image-panel_image-selector_repository'}
            items={this.state.selectableRepositories}
            itemToString={undefined}
            invalid={this.state.imageRepository && this.state.imageRepository.invalid ? t(`clg.cmp.containerimage.selector.repository.invalid.${this.state.imageRepository.invalid}`) : undefined}
            light={true}
            nlsKey={'clg.cmp.containerimage.selector.repository'}
            onChange={this.onRepositoryChange}
            selectedItem={this.state.imageRepository}
          />

          <ClgComboBox
            hasPlaceholderText={true}
            isLoading={this.state.isLoadingRegistryNamespaces || this.state.isLoadingRegistryRepositories || this.state.isLoadingRegistryImages}
            isDisabled={false}
            inputId={'container-image-panel_image-selector_image'}
            items={this.state.selectableImages || []}
            itemToString={undefined}
            invalid={this.state.imageTag && this.state.imageTag.invalid ? t(`clg.cmp.containerimage.selector.image.invalid.${this.state.imageTag.invalid}`) : undefined}
            light={true}
            nlsKey={'clg.cmp.containerimage.selector.image'}
            onChange={this.onTagChange}
            selectedItem={this.state.imageTag}
          />
        </div>
      </div>
    );
  }

  private getCurrentImageRefTarget() {
    return `${this.props.selectedRegistry && this.props.selectedRegistry.name || '_'}::${this.state.imageNamespace && this.state.imageNamespace.id || '_'}::${this.state.imageRepository && this.state.imageRepository.id || '_'}::${this.state.imageTag && this.state.imageTag.id || '_'}`;
  }

  private reset() {
    this.setState({
      errorOnImageSelection: undefined,
      imageNamespaces: [],
      imageRepositories: {},
      imageTags: {},
      ownUpdate: true,
      selectableRepositories: [],
      selectableImages: [],
    });
  }

  private validateImageParts() {
    let isValid = false;
    if ((this.state.imageNamespace.id !== '' && !this.state.imageNamespace.invalid) &&
      (this.state.imageRepository.id !== '' && !this.state.imageRepository.invalid) &&
      (this.state.imageTag.id !== '' && !this.state.imageTag.invalid)) {
      isValid = true;
    }

    if (isValid) {
      this.onImageSelected();
    } else {
      // publish the changes to the parent
      this.props.onChange(undefined);
    }
  }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
ClgImageRefSelectors.propTypes = {
  image: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  project: PropTypes.object,
  selectedRegistry: PropTypes.object,
};

export default ClgImageRefSelectors;
