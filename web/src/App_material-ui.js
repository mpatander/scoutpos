/**
 * (C) 2019 - Marco Patander
 * 
 * This file is part of ScoutPOS. ScoutPOS is released
 * under the GPLv3 only for non-profit organizations.
 * For other businesses contact the mantainers.
 * 
 * ScoutPOS Cashier User Interface
 * 
 */
import React from 'react';
// import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { SnackbarProvider, withSnackbar } from 'notistack';
import { withStyles } from '@material-ui/core/styles';
// import { makeStyles } from '@material-ui/styles';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Tooltip from '@material-ui/core/Tooltip';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
// import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import ThumbDownIcon from '@material-ui/icons/ThumbDown';
import Badge from '@material-ui/core/Badge';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Avatar from '@material-ui/core/Avatar';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
// import FormControl from '@material-ui/core/FormControl';
// import Input from '@material-ui/core/Input';
import LocalPrintshopIcon from '@material-ui/icons/LocalPrintshop';

// const styledBy = (property, mapping) => props => mapping[props[property]];



const styles = (theme) => ({
  grow: {
    flexGrow: 1
  },
  main_content: {
//     height: '100vh',
    heigth: '100%',
//     height: 'calc(100%-64dp)'
  },
  appBarShim: {
    ...theme.mixins.toolbar
  },
  order_list_container: {
    height: '100%',
  },
  order_list: { height: '100%', overflow: 'auto' },
});



function ShopItem({ item, parent }) {
//   let items_tooltip = (<React.Fragment key={'ttc_'+item.name} >{"Costo: "+item.cost+"€"}</React.Fragment>)
  let items_tooltip = ""
  if (typeof(item.items) !== 'undefined') {
    items_tooltip = [items_tooltip,
        //<React.Fragment key={'ttk_'+item.name} ><br/><br/><b>Comprende:</b></React.Fragment>,
        <React.Fragment key={'ttk_'+item.name} ><b>Comprende:</b></React.Fragment>,
        Object.keys(item.items).map((name,index) => <React.Fragment key={'ttf_'+name}><br/>{name}</React.Fragment>)
                    ]
  }
  const StyledBadge = withStyles(theme => ({
              badge: {
                background: `${ (parent.state.itemsCount[item.count_as] < 0) ? '#ff5252' : (parent.state.itemsCount[item.name] < 25) ? '#ffff00' : '#eeeeee' }`,
                color: 'black',
              },
            }))(Badge);
  return <Grid item xs={3}><Tooltip title={items_tooltip}>
          <StyledBadge max='999' badgeContent={ (typeof parent.state.itemsCount[item.count_as] !== 'undefined') ? parent.state.itemsCount[item.count_as] : 0} >
            <Button
                variant={item.type==='t'?'outlined':'contained'}
                color='primary'
                fullWidth
                onClick={ () => { parent.addToOrder(item) } }
            >{item.name} ({parseFloat(Math.round(item.cost*100)/100).toFixed(2)}€)</Button>
          </StyledBadge>
         </Tooltip></Grid>;
}


const CONNECTION_CHECK_TIMEOUT = 1000;
const CONNECTION_CHECK_PERIOD = 3000;
class ScoutPosUIComponent extends React.Component {
  
  constructor(props) {
    super(props);
    this.shopitems = []
    this.state = {
      order_idx: 0,
      order: [],
      total: 0,
      labels: {
          incomeStr: '',
          billStr: '',
          remLabelStr: 'Resto',
          remValueStr: '',
        },
      itemsCount: {},
      connected: true
    };
  }
  
  
  render() {
    const { classes } = this.props;
    return (
      <React.Fragment>
        <AppBar>
        <Toolbar>
          <Typography variant="h6" color="inherit">
            Cassa tortafrittata scout
          </Typography>
          
          <div className={classes.grow} />
          
          <Avatar><LocalPrintshopIcon color={(this.state.connected)?'inherit':'error'} /></Avatar>
        </Toolbar>
        </AppBar>
        <div className={classes.main_content}>
        <div className={classes.appBarShim}></div>
        <Grid container spacing={8}>
          <Grid item xs={9} style={{margin: 10}}>
            <Grid container spacing={16} justify="center" alignItems="stretch">
              {this.shopitems.filter(item => {
                return typeof(item.name) !== 'undefined' &&
                    ( typeof(item.disable) === 'undefined' ||
                      item.disable !== true );
              }).map(item => {
                return (<ShopItem key={'shopadd_'+item.name} item={item} parent={this} />);
              })}
              <Grid item xs={6}>
              <Button variant="contained" color="primary" fullWidth
                  disabled={!this.state.canBuy}
                  onClick={ this.confirmOrder.bind(this) }
                >
                Conferma
              </Button></Grid>
            </Grid> {/* buttons container */}
            {/* bottom-left container */}
            <Grid container spacing={8} justify="space-evenly" alignItems='center'>
              <Grid item xs>
                <TextField
                  label="Totale"
                  value={this.state.labels.billStr}
                  type='number'
                  placeholder='0.00'
                  readOnly={true}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">€</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs>
                <TextField label="Pagato"
                  value={this.state.labels.incomeStr}
                  placeholder='0.00'
                  type='number'
                  onChange={(e) => {
                      const newIncomeStr = e.target.value
                      this.updateRem((prevState) => ({
                          labels: { ...prevState.labels, incomeStr: newIncomeStr },
                        }) )
                    } }
                  onBlur={(e) => {
                      this.updateRem((prevState) => ({
                          labels: { ...prevState.labels,
                              incomeStr: (prevState.labels.incomeStr === '')?'':Number(prevState.labels.incomeStr).toFixed(2),
                            }
                        }) )
                    } }
                  InputProps={{
                    startAdornment: <InputAdornment position="start">€</InputAdornment>,
                  }}
                  />
              </Grid>
              <Grid item xs>
                <TextField
                  label={this.state.labels.remLabelStr}
                  value={this.state.labels.remValueStr}
                  placeholder='0.00'
                  readOnly={true}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">€</InputAdornment>,
                  }}
                />
              </Grid>
            </Grid> {/* bottom-left container */}
          </Grid> {/* left item */}
          
          <Grid item xs>
            <Paper className={classes.order_list_container}>
            <List className={classes.order_list}>
              {this.state.order.map((item) => {
                return (<ListItem key={item.id} >
                  <ListItemAvatar>
                    <Avatar>{item.count}</Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={item.what.name} />
                  <IconButton aria-label="Decrement" onClick={() => {this.decrementOrder(item.id)}} >
                    <ThumbDownIcon />
                  </IconButton>
                  <IconButton aria-label="Delete" onClick={() => {this.removeOrder(item.id)}} >
                    <DeleteIcon />
                  </IconButton>
                </ListItem>);
              })}
            </List>
            </Paper>
          </Grid>
        </Grid>
        
        </div>
      </React.Fragment>
    );
  }
  
  componentDidMount() {
    this.reloadItems()
    this.startConnectionChecks()
  }
  
  reloadItems() {
    fetch('./price_list.json', { cache: 'no-cache' }).then( response => {
      return response.json();
    }).then( data => {
      const findInPriceList = (data,name) => {
        for (let item of data) {
          if (item.name === name) return item
        }
        return null
      }
      data.forEach((part,index,data) => {
        if (typeof(part.items) !== 'undefined') {
          data[index].type = 'nt'
          let mitems = {}
          for (let item of part.items) {
            if (item in mitems) {
              mitems[item].count += 1
            } else {
              mitems[item] = {
                  what: findInPriceList(data,item),
                  count: 1
                }
            }
          }
          data[index].items = mitems
        } else {
          if (typeof(part.count_as) === 'undefined') {
            data[index].count_as = part.name
          }
          data[index].type = 't'
        }
      })
      data = data.sort((a,b) => {
            if (a.type < b.type) return -1;
            if (a.type > b.type) return  1;
            
            if (a.name < b.name) return -1;
            if (a.name > b.name) return  1;
            
            return 0;
          })
      this.shopitems = data
      // TODO clear order only if json changed
      this.clearOrder()
      this.forceUpdate()
    })
  }
  
  saveInState(what) {
    return (evt) => {
      this.setState({ [what]: evt.target.value })
    }
  }
  
  updateCounts(items) {
    this.setState(prevState => ({
        ...prevState,
        itemsCount: items,
      }))
  }
  
  updateRem(stateUpdate) {
    this.setState(prevState => {
      let stateChange = stateUpdate(prevState)
      let updatedState = Object.assign({},prevState,stateChange)
//       let updatedState = {
//           ...prevState,
//           ...stateChange,
//         };
      let total = Number(updatedState.labels.billStr)
      let income = Number(updatedState.labels.incomeStr)
      if (updatedState.labels.billStr === '') total = 0;
      if (updatedState.labels.incomeStr === '') income = 0;
      return ({
        ...stateChange,
        labels: { ...updatedState.labels,
            remLabelStr: (income<total)?'Mancano':'Resto',
            remValueStr: (updatedState.labels.billStr===''&&updatedState.labels.incomeStr==='')?'':(Math.abs(income-total)).toFixed(2),
          },
        canBuy: (updatedState.order.length !== 0)&&(updatedState.labels.incomeStr !== '')&&(income>=total),
      })
    })
  }
  
  addToOrder(item) {
    this.updateRem( prevState => {
        let new_order = prevState.order
        let orderItem = new_order.find((e) => { return e.what.name === item.name; })
        let new_order_idx = prevState.order_idx
        if (typeof(orderItem) !== 'undefined') {
          orderItem.count += 1
        } else {
          new_order_idx += 1
          new_order.push({ id: new_order_idx, count: 1, what: item })
        }
        return ({
          order: new_order,
          order_idx: new_order_idx,
          total: prevState.total + item.cost,
          labels: { ...prevState.labels,
              billStr: (prevState.total + item.cost).toFixed(2),
            },
        })
      })
  }
  
  decrementOrder(ref_id) {
    this.updateRem( prevState => {
        let new_order = prevState.order
        let orderItem = new_order.find((e) => { return e.id === ref_id; })
        let new_total = prevState.total
        if (typeof(orderItem) !== 'undefined') {
          new_total -= orderItem.what.cost
          orderItem.count -= 1
          if (orderItem.count === 0) {
            new_order = new_order.filter(e => { return e.id !== ref_id; })
          }
        }
        return ({
          order: new_order,
          total: new_total,
          labels: { ...prevState.labels,
              billStr: (typeof(orderItem) !== 'undefined' && prevState.order.length === 1)?'':new_total.toFixed(2),
            }
        })
      })
  }
  
  removeOrder(ref_id) {
    this.updateRem( prevState => {
        let orderItem = prevState.order.find((e) => { return e.id === ref_id; })
        let new_total = prevState.total
        if (typeof(orderItem) !== 'undefined') {
          new_total -= orderItem.count * orderItem.what.cost
        }
        return ({
          order: prevState.order.filter(e => { return e.id !== ref_id; }),
          total: new_total,
          labels: { ...prevState.labels,
              billStr: (typeof(orderItem) !== 'undefined' && prevState.order.length === 1)?'':new_total.toFixed(2),
            }
        })
      })
  }
  
  clearOrder() {
    this.updateRem( prevState => {
      let newLabels = Object.assign({}, prevState.labels, {
              billStr: '',
              incomeStr: ''
            })
      return ({
          order_idx: 0,
          order: [],
          total: 0,
          labels: newLabels
        })
      } )
  }
  
  confirmOrder() {
    if (window.location.port === '3000') {
      alert('Order would be processed on the real server')
      this.clearOrder()
      return;
    }
    fetch('./confirm', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order: this.state.order.map( (item) => ({ ...item, id: undefined }) ),
        total: this.state.total,
        bill: Number(this.state.labels.billStr),
        income: Number(this.state.labels.incomeStr),
        change: Number(this.state.labels.remValueStr),
      })
    })
    .then( response => {
      return response.json()
    }).then( data => {
      this.clearOrder();
      this.props.enqueueSnackbar('Enqueued request '+data.req_id,{
          variant: 'success',
          action: (
            <Button size="small">{'OK'}</Button>
          ),
          //autoHideDuration: 1000,
        });
    });
  }
  
  startConnectionChecks() {
    this.lastSentStatusRequest = 0
    this.lastRecvdStatusResponse = 0
    this.checksStartTime = new Date().getTime()
    // avoid status spam logs when served with npm start
    if (window.location.port === '3000') {
      this.setState({ connected: false })
    } else {
      this.periodicConnectionCheck = setInterval(this.checkConnection.bind(this),CONNECTION_CHECK_PERIOD)
    }
  }
  stopConnectionChecks() {
    clearInterval(this.periodicConnectionCheck)
    delete this.periodicConnectionCheck
  }
  checkConnection() {
    this.lastSentStatusRequest += 1
    const statusRequestId = this.lastSentStatusRequest
    var didTimeout = false
    const checkStart = new Date().getTime()
    const timeout = setTimeout(() => {
        didTimeout = true
        if (this.state.connected) this.setState({ connected: false })
        console.log('Status request timeout (id:'+statusRequestId.toString()+')')
      },CONNECTION_CHECK_TIMEOUT)
    fetch('./status',{
        headers: {
          'Accept': 'application/json'
        }
      }).then( response => {
        clearTimeout(timeout)
        let responseTime = new Date().getTime()
        if (didTimeout) {
          console.log('Discarding out-of-time status response (rtt: '+(responseTime-checkStart)+'ms, id:'+statusRequestId.toString()+')')
        } else if (statusRequestId < this.lastRecvdStatusResponse) {
          console.log('Discarding out-of-order status response (rtt: '+(responseTime-checkStart)+'ms, id:'+statusRequestId.toString()+')')
        } else if (response.status !== 200) {
          if (this.state.connected) this.setState({ connected: false })
          // Already notified by fetch
          // console.error('Status check failure '+response.status.toString())
        } else {
          this.lastRecvdStatusResponse = statusRequestId
          if (!this.state.connected) this.setState({ connected: true })
          // OK we are connected
          return response.json()
        }
      }).then( data => {
//         console.log(data.pantry)
        this.updateCounts(data.pantry)
      }).catch( e => {
        clearTimeout(timeout)
        if (this.state.connected) this.setState({ connected: false })
        // Already notified by fetch
        // console.error(e.message)
      })
  }
  
}

ScoutPosUIComponent.propTypes = {
  enqueueSnackbar: PropTypes.func.isRequired,
};

const ScoutPOSUI = withStyles(styles)(withSnackbar(ScoutPosUIComponent));

function App() {
  return (
    <SnackbarProvider maxSnack={3}>
      <ScoutPOSUI />
    </SnackbarProvider>
  );
}


export default App;

