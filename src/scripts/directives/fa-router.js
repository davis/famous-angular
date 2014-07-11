angular.module('famous.angular')
.directive('faRouter', ["$famous", "$famousDecorator", "$famousState", "$compile", "$controller", "$parse",
 function ($famous, $famousDecorator, $famousState, $compile, $controller, $parse) {
  return {
    scope: true,
    transclude: 'true',
    restrict: 'ECA',
    compile: function(element , attrs, transclude ) {
          var parent;
          var initial = element.html();

      return   function($scope , element, attrs) {

          var isolate = $famousDecorator.ensureIsolate($scope);
          var View = $famous['famous/core/View'];
          var RenderNode = $famous['famous/core/RenderNode'];
          var Modifier = $famous['famuos/core/Modifier'];
          var anchorNode = new View();
          isolate.renderNode = anchorNode;
          var previousNode = new RenderNode();
          var currentNode = new RenderNode();

          anchorNode.add(previousNode);
          anchorNode.add(currentNode);

          var currentScope , currentEl , previousEL, locals,flipperScope;

          isolate.renderNode = isolate.renderNode || anchorNode; 
          isolate.states = isolate.states || {}; 
          isolate.currentState = isolate.currentState || 'root';
          
             
          function updateView (evt, data) {

            if(evt.targetScope.$id !== $scope.$id){

              var previousView = isolate.states[isolate.fromState];
              var currentView = isolate.states[isolate.currentState] ;
              currentView.isolate = data;

              if(previousView && previousView.isolate.renderNode ) {

                currentNode.set(currentView.isolate.renderNode);
                var inTransitionFromFn = $parse(currentView.inTransitionFrom);
                inTransitionFromFn(currentView.$scope, {$callback : function() {
                  console.log('show completed');
                }});
                

                previousNode.set(previousView.isolate.renderNode);
                var outTransitionToFn = $parse(previousView.outTransitionTo);
                outTransitionToFn(previousView.$scope, { $callback : function() {
                  previousNode.set(new RenderNode());
                  console.log('hide completed');
                }});
               
              }else {
                currentNode.set(currentView.isolate.renderNode);

                var inTransitionFromFn = $parse(currentView.inTransitionFrom);
                inTransitionFromFn(currentView.$scope, {$callback : function() {
                  console.log('show completed');
                }});
              }
              evt.stopPropagation();
            }
               
          }
          function createView() {
            if( isolate.currentState === $famousState.current) return;
            
            locals =   isolate.states[$famousState.current] || $famousState.$current;
            locals.$template = $famousState.$template;
            currentEl = "<fa-view>" + locals.$template +"</fa-view>";
            element.html(currentEl);
            isolate.fromState = isolate.currentState;
            isolate.currentState = $famousState.current;

            if(isolate.states[isolate.currentState] && isolate.states[isolate.currentState].isolate) {
              currentScope = isolate.states[isolate.currentState].$scope;
              currentScope.$emit('registerChild',isolate.states[isolate.currentState].isolate);
            }else {

              currentScope =  $scope.$new();
              var link  = $compile(element.contents());
              locals.$scope =  currentScope;
              isolate.states[$famousState.current] = locals;
              if(locals.controller){
                var controller = $controller(locals.controller, locals);
                if($famousState.$current.controllerAs){
                  currentScope[$famousState.$current.controllerAs] = controller;
                }
                
                angular.element(currentEl).data('$ngControllerController',controller);   
              }

              link(currentScope);
            }

            currentScope.$emit('$viewContentLoaded');

          }
          
          $scope.$on('registerChild', updateView);
          $scope.$on('$stateChangeSuccess', createView);
         

          $scope.$emit('registerChild', isolate);
        };
      }
    
    };
}]);