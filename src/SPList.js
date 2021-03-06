import React, { Component } from "react";
// contrib
import DataTables from 'material-ui-datatables';
import CircularProgress from 'material-ui/CircularProgress';
// Custom
import SPListAPIHandler from './SPListAPIHandler';

export default class SPList extends React.Component {
  state = { cols: [],
            items: [], //filtered items
            allItems: [],
            selected: [],
            child: null, //nested tables
            order: 'asc',
            orderBy: 'title',
            isLoaded: false
          };
  //table styles
  styles = {
  titleStyle: {
    fontSize: 46,
    margin: '0 auto',
    color: '#8C1D40',
  },
  tableStyle: {
    width: '800%'
  },
  tableBodyStyle: {
    overflow: 'visible'
  },
  tableWrapperStyle: {
    padding: 5,
    overflow: 'visible',
  },
  progressStyle:{
    marginLeft: 'auto',
    marginRight: 'auto',
    display: 'block',
  },
  progressLabelStyle:{
    marginLeft: 'auto',
    marginRight: 'auto',
    textAlign: 'center',
  },
};

  mapColumns(data){
      //maping the returned object to what datatables is expecting for columns prop
      return (data.map((colData,index)=> {
          if(index==0){
            //if first column and 3 or fewer keys exist, assume it is child table and add styles
            return ({
            key: colData.InternalName,
            label: colData.Title,
            sortable: true,
            tooltip: colData.Description,
            style: {
              whiteSpace: 'normal',
            },
            render: (col, row) => (Object.keys(row).length < 4) ? <div id={'childTable'}
                                                                    style={{position:'relative',zIndex:'10',}}>{col}</div>
                                                            : <div dangerouslySetInnerHTML={{__html: col}} />
            });
          }
          else{
            //any other col
            return ({
              key: colData.InternalName,
              label: colData.Title,
              sortable: true,
              tooltip: colData.Description,
              style: {
                whiteSpace: 'normal',
              },
              render: (col, row) => <div dangerouslySetInnerHTML={{__html: col}} />
            });
        }
      })
    );
  }

  componentDidMount() {
    //get list data from SP api
    /*const MySPAPIHandler = new SPListAPIHandler(this.props.listName,
                                  (function(){this.setState({isLoaded:true,cols:MySPAPIHandler.cols,items:MySPAPIHandler.items,allItems:MySPAPIHandler.items});}).bind(this),
                                  function(){console.log('api error')});
    MySPAPIHandler.getCols();*/
    const MySPAPIHandler = new SPListAPIHandler();
    //gets data by view name (still being implemented)
    MySPAPIHandler.getListViewItems(_spPageContextInfo.webAbsoluteUrl,this.props.listName)
    .done((function(data)
    {
         this.setState({isLoaded:true,cols:this.mapColumns(MySPAPIHandler.cols),items:data.d.results,allItems:data.d.results});
         console.log(this.state.items);
         console.log(this.state.cols);
    }).bind(this))
    .fail(
        function(error){
            console.log(JSON.stringify(error));
    });
  }

  componentDidUpdate() {
    $('.childTable').parent().parent().css({ 'position': 'relative','z-index':'-1' });
  }

  handleFilterValueChange = (filter) => {
    //implements the search function
    var result = [];
    if(filter === '' || filter == 'undefined'){
      result = this.allItems;
    }
    else {
      var result = this.state.items.filter(function(item) {
        return Object.values(item).some(function(value) {
          return value.toString().toLowerCase().includes(filter.toLowerCase());
        });
      });
    }
    this.setState({items:result});
  }

  handleSortOrderChange = (key, order) => {
    //implements the sort function
    if (this.state.orderBy === key && this.state.order === 'desc') {
      order = 'asc';
    }

    const items =
      order === 'desc'
        ? this.state.items.sort((a, b) => (b[key] < a[key] ? -1 : 1))
        : this.state.items.sort((a, b) => (a[key] < b[key] ? -1 : 1));

    this.setState({ items, order, key });
  }

  handleRowSelection = (index) => {
    //add nested row on selection
    var items = this.state.items.slice();
    if(index.length == 0){
      //if already selected, delete child row
      items.splice(this.state.child,1);
      this.setState({items:items,selected:[],child:null});
    }
    else if(index[0] == this.state.child){
      //if row is child do nothing
      return;
    }
    else{
      //if new row delete existing child, then create new
      if(this.state.child!=null){
        items.splice(this.state.child,1);
        index[0] = index[0]>this.state.child?index[0]-1:index[0]; //decrement since removed an element before it
      }
      var nestedCol = [
          {
            key:'Test1',
            label:'Test1'
          },
          {
            key:'Test2',
            label:'Test2'
          },
          {
            key:'Test3',
            label:'Test3'
          }
      ];
      var nestedData = [
          {
            Test1:'Value1',
            Test2:'Value2',
            Test3:'Value3'
          },
          {
            Test1:'Value12',
            Test2:'Value22',
            Test3:'Value32'
          },
          {
            Test1:'Value13',
            Test2:'Value23',
            Test3:'Value33'
          }
      ];
      items.splice(index[0]+1,0,{LinkTitleNoMenu: <DataTables tableBodyStyle={this.styles.tableBodyStyle}
                                                    tableStyle={this.styles.tableStyle}
                                                    tableWrapperStyle={this.styles.tableWrapperStyle}
                                                    columns={nestedCol}
                                                    data={nestedData}
                                                    showRowHover={true}
                                                    showHeaderToolbar={false}
                                                    showFooterToolbar={false}/>
                                                  ,Port_x0020_Number:''
                                                });
      this.setState({items:items,selected:index,child:index[0]+1});
    }
  }

  render() {
    //if items is not loaded yet show progress spinner
    const tableData = (!this.state.isLoaded)?(<div><CircularProgress size={60} thickness={7} style={this.styles.progressStyle}/><p style={this.styles.progressLabelStyle}>Loading Data</p></div>):
      (<DataTables
        title={decodeURI(this.props.listName).split().map((word)=>(word.charAt(0).toUpperCase() + word.slice(1))).join()}
        titleStyle={this.styles.titleStyle}
        height={'auto'}
        showRowHover={true}
        headerToolbarMode={'default'}
        columns={this.state.cols}
        data={this.state.items}
        showHeaderToolbar={true}
        selectable={true}
        selectedRows={this.state.selected}
        onFilterValueChange={this.handleFilterValueChange}
        onSortOrderChange={this.handleSortOrderChange}
        onRowSelection={this.handleRowSelection}
      />);
    return (
      tableData
    );
  }
}
