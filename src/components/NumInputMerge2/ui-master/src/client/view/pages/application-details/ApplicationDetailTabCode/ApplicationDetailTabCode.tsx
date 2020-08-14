// react
import PropTypes from 'prop-types';
import React from 'react';

// 3rd-party
import * as log from 'loglevel';

// coligo
import * as appModel from '../../../../../common/model/application-model';
import * as configModel from '../../../../../common/model/config-model';
import * as projectModel from '../../../../../common/model/project-model';
import * as commonValidator from '../../../../../common/validator/common-validator';
import ClgContainerImage from '../../../components/ClgContainerImage/ClgContainerImage';
import * as viewApplicationModels from '../../../model/application-view-models';

interface IProps {
  handleChange: (key: string, updatedValues: viewApplicationModels.IViewApplicationCode) => any;
  isEditMode: boolean;
  project?: projectModel.IUIProject;
  revision: appModel.IUIApplicationRevision;
}

interface IState {
  image: commonValidator.IClgTextField;
  imagePullSecret?: string;
  isSaveDisabled: boolean;
  project?: projectModel.IUIProject;
}

class ApplicationDetailTabCode extends React.Component<IProps, IState> {
  private readonly COMPONENT = 'ApplicationDetailTabCode';

  // setup the logger
  private logger = log.getLogger(this.COMPONENT);

  constructor(props) {
    super(props);

    this.state = {
      image: {
        val: props.revision.image,
      },
      imagePullSecret: props.revision.imagePullSecret,
      isSaveDisabled: false,
      project: props.project,
    };

    // bind the onChangeCurrency functions to this, to allow state updates
    this._populateChangesToParent = this._populateChangesToParent.bind(this);
    this.onImageChange = this.onImageChange.bind(this);
    this.shouldDisableSave = this.shouldDisableSave.bind(this);
  }

  public UNSAFE_componentWillReceiveProps(newProps: IProps) {
    const fn = 'componentWillReceiveProps ';
    this.logger.trace(`${fn}- props: '${JSON.stringify(newProps)}'`);

    // decide whether to update the code parameters or, not
    // in case the edit mode is active, we must not override the state
    if (newProps.revision && !newProps.isEditMode) {
      this.logger.debug(`${fn}- the component state needs an update`);
      this.setState({
        image: { val: newProps.revision.image },
        imagePullSecret: newProps.revision.imagePullSecret
      });
    }

    if (!this.state.project && newProps.project) {
      this.setState({ project: newProps.project });
    }
  }

  public componentDidMount() {
    const fn = 'componentDidMount ';
    this.logger.debug(`${fn}>`);

    // we need to set the state right after initializing the form, to reset the state
    this.setState({
      isSaveDisabled: this.shouldDisableSave(this.state.image, this.state.imagePullSecret),
    });

    this.logger.debug(`${fn}<`);
  }

  public render() {
    const fn = 'render ';
    this.logger.debug(`${fn}- isEditMode? ${this.props.isEditMode}, image: '${JSON.stringify(this.state.image)}', imagePullSecret: '${this.state.imagePullSecret}'`);
    return (
      <div className='clg-application-detail-page--code coligo-tab'>
        <div className='bx--form__fieldset'>
          <ClgContainerImage
            idPrefix={`${this.props.revision.name}`}
            isEditMode={this.props.isEditMode}
            image={this.state.image}
            nlsKeyPrefix='clg.application'
            onChange={this.onImageChange}
            project={this.state.project}
            registryName={this.state.imagePullSecret}
            allowToUsePublicRegistry={true}
          />
        </div>
      </div>
    );
  }

  private shouldDisableSave(
    image: commonValidator.IClgTextField,
    imagePullSecret: string): boolean {

    const fn = 'shouldDisableSave ';

    this.logger.trace(`${fn}>`);

    // check if all fields were validated
    if (!image.invalid) {
      this.logger.trace(`${fn}< false`);
      return false;
    }

    // disable the create button
    this.logger.trace(`${fn}< true`);
    return true;
  }

  private onImageChange(event) {
    this.logger.debug(`onImageChange > event: '${JSON.stringify(event)}'`);

    this._populateChangesToParent(event.image, event.registry);

    this.setState(() => ({
      image: event.image,
      imagePullSecret: event.registry && event.registry.name,
    }));
  }

  /**
   * This function is used to populate the current state to the parent component
   */
  private _populateChangesToParent(image: commonValidator.IClgTextField, registry: configModel.IUIRegistrySecret) {
    // evaluate whether the save button must be disabled
    const shouldDisableSaveBtn = this.shouldDisableSave(image, registry && registry.name);

    this.props.handleChange('code', { image, shouldDisableSaveBtn, registry });
  }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
ApplicationDetailTabCode.propTypes = {
  handleChange: PropTypes.func.isRequired,
  isEditMode: PropTypes.bool.isRequired,
  project: PropTypes.object,
  revision: PropTypes.object.isRequired,
};

export default ApplicationDetailTabCode;
