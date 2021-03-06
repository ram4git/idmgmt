import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import Webcam from 'react-webcam';
import Barcode from 'react-barcode';
import Rand from 'random-key';
import Clock from 'react-live-clock';
import Moment from 'moment';
import { Print } from 'react-easy-print';
import Article from 'grommet/components/Article';
import Box from 'grommet/components/Box';
import Form from 'grommet/components/Form';
import FormField from 'grommet/components/FormField';
import TextInput from 'grommet/components/TextInput';
import Section from 'grommet/components/Section';
import Split from 'grommet/components/Split';
import Image from 'grommet/components/Image';
import Anchor from 'grommet/components/Anchor';
import LinkPrevious from 'grommet/components/icons/base/LinkPrevious';
import Header from 'grommet/components/Header';
import Notification from 'grommet/components/Notification';
import Heading from 'grommet/components/Heading';
import Button from 'grommet/components/Button';
import Edit from 'grommet/components/icons/base/Print';
import Toast from 'grommet/components/Toast';
import { uploadEmployeeImage } from '../api/employees';
import { saveEmployee } from '../api/employees';
import Headline from 'grommet/components/Headline';


class NewEmployee extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showLiveCameraFeed: true,
      employeeId: Rand.generateBase30(8)
    };
  }

  onFieldChange(fieldName, e) {
    this.setState({
      [fieldName]: e.target.value
    });
  }

  setRef(webcam) {
    this.webcam = webcam;
  }

  toastClose() {
    this.setState({ toastMsg: '' });
  }

  capture() {
    if (this.state.showLiveCameraFeed) {
      const screenshot = this.webcam.getScreenshot();
      this.setState({
        screenshot,
        showLiveCameraFeed: false
      });
    } else {
      this.setState({
        showLiveCameraFeed: true,
        screenshot: ''
      });
    }
  }

  saveAndPrint() {
    const { employeeId, name, info, screenshot, timestamp } = this.state;

    let imgFile = screenshot.replace(/^data:image\/\w+;base64,/, "");
    uploadEmployeeImage(imgFile, employeeId).then((snapshot) => {
         console.log(snapshot.downloadURL);
         let screenshot = snapshot.downloadURL;
         saveEmployee({
           employeeId,
           name,
           info,
           screenshot,
           timestamp,
           status: 'ENTERED',
           history: [
             {
               timestamp,
               status: 'ENTERED',
               enteredBy: window.localStorage.email,
               description: 'nothing'
             }
           ]
         })
           .then(
             this.setState({
               toastMsg: `User ${name} is saved `
             }, () => { window.print(); })
           )
           .catch((err) => {
             console.error('EMPLOYEE SAVE ERR', err);
             this.setState({
               validationMsg: `Unable to save ${name}. Contact admin for assistance`
             });
           })
       }).catch((e) => console.log(e))


  }

  onSubmitClick() {
    const { name, screenshot } = this.state;
    if (!name) {
      this.setState({
        validationMsg: 'NAME is missing'
      });
      return;
    }

    if (!screenshot) {
      this.setState({
        validationMsg: 'IMAGE is not taken. Click on video to take photo!'
      });
      return;
    }
    const timestamp = new Date();
    const timestampStr = Moment(timestamp).format('DD/MM/YYYY hh:mm:ss A');
    this.setState({
      timestamp,
      timestampStr,
      validationMsg: ''
    }, this.saveAndPrint.bind(this));
  }


  renderImage() {
    if(this.state.showLiveCameraFeed) {
      return (
        <Webcam
          audio={false}
          height={300}
          ref={this.setRef.bind(this)}
          screenshotFormat='image/jpeg'
          width={400}
          onClick={this.capture.bind(this)}
        />
      );
    }
    return (
      <Image src={this.state.screenshot} height={300}/>
    );
  }

  renderCamera() {
    return (
      <Box>
        { this.renderImage() }
      </Box>
    );
  }


  renderBusinessCardForPrint() {
    const { name = '', info = '', timestampStr } = this.state;
    const printName = name.substring(0, 16);
    const printInfo = info.substring(0, 20);

    return (
      <Print name='bizCard' exclusive>
        <div className='card'>
          <div className='card-body'>
            <div className='box header'>
              <h3>Lalitha Industries</h3>
            </div>
            <div className='box sidebar'>
              <Image src={this.state.screenshot} />
            </div>
            <div className='box content'>
              <h5 className='bold'>{printName}</h5>
              <h5>{printInfo}</h5>
              <h5>{timestampStr}</h5>
            </div>
            <div className='box footer' style={{width:'30%', float:'right'}}>
              <Barcode value={this.state.employeeId}
                height={40}
              />
            </div>
          </div>
        </div>
      </Print>
    );
  }

  renderToastMsg() {
    const { toastMsg } = this.state;
    if (toastMsg) {
      return (
        <Toast status='ok'
          onClose={ this.toastClose.bind(this) }>
          { toastMsg }
        </Toast>
      );
    }
    return null;
  }

  renderValidationMsg() {
    const { validationMsg } = this.state;
    if (validationMsg) {
      return (
        <Notification message={validationMsg} size='small' status='critical' />
      );
    }
    return null;
  }

  render() {
    return (
      <div className='newEmployee'>
        { this.renderValidationMsg() }
        <Article scrollStep={false}
          direction='column'
          primary={true} full={true}>

          <Section pad='small'
            justify='center'
            className='fields'
            align='center'>
            <Headline size="small">
                    <span>Date :   <Clock className='visitorClock' format={'DD/MM/YYYY'}/></span>
                    <span style={{marginLeft : '20px'}}>Time :   <Clock className='visitorClock' format={'hh:mm:ss A'} ticking={true} /></span>
            </Headline>
            <Split>
              <Box className='left' direction='column'>
                <Box align='center'>

                  <Form>
                    <FormField label='Name' strong={true} size='small' style={{marginTop : '15px'}}>
                      <TextInput
                        placeHolder='name'
                        onDOMChange={this.onFieldChange.bind(this, 'name')}
                      />
                    </FormField>
                    <FormField label='Info' strong={true} size='small' style={{marginTop : '15px'}}>
                      <TextInput
                        placeHolder='extra info'
                        onDOMChange={this.onFieldChange.bind(this, 'info')}
                      />
                    </FormField>
                  </Form>
                </Box>

              </Box>
              <Box onClick={this.capture.bind(this)} direction='column'
              className='right'
              align='center'
              style={{marginTop:'25px'}}>
                {this.renderCamera() }
                <Barcode value={this.state.employeeId} height="20"/>
                <Section pad='small'
                  align='center'>
                  <Button icon={<Edit />}
                    label='SAVE & PRINT'
                    onClick={this.onSubmitClick.bind(this)}
                    disabled={true}
                    href='#'
                    primary={true} />
                </Section>
                </Box>
            </Split>
          </Section>

        </Article>
        { this.renderBusinessCardForPrint() }
      </div>
    );
  }
}

const select = state => ({ ...state.newUser });

export default connect(select)(NewEmployee);
