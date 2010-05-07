class MainController < ApplicationController

  def index
    
  end
  
  def truthify
    if (@result = Result.create!(:source_url => params[:url], :source_text => params[:text]))
      redirect_to "/" + @result.slug
    else
      flash[:error] = "Sorry, couldn't truthify that input."
      redirect_to :back
    end
  end  
  
  def result
    @result = Result.first(:slug => params[:slug])
  end
  
end